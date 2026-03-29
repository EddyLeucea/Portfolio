export const config = {
  api: {
    bodyParser: false,
  },
};

function truncate(value, maxLength) {
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function getHeaderValue(headers, key) {
  if (!headers) return undefined;
  if (typeof headers.get === "function") {
    return headers.get(key);
  }
  return headers[key] || headers[key.toLowerCase()];
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return Buffer.from(req.body);
  }

  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    return null;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseMultipartFormData(contentType, bodyBuffer) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw new Error("Missing multipart boundary");
  }

  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const bodyText = bodyBuffer.toString("latin1");
  const parts = bodyText.split(boundary).slice(1, -1);

  const fields = {};
  let file = null;

  for (let part of parts) {
    if (part.startsWith("\r\n")) {
      part = part.slice(2);
    }
    if (part.endsWith("\r\n")) {
      part = part.slice(0, -2);
    }

    const headerEndIndex = part.indexOf("\r\n\r\n");
    if (headerEndIndex === -1) {
      continue;
    }

    const rawHeaders = part.slice(0, headerEndIndex);
    const rawContent = part.slice(headerEndIndex + 4);
    const contentDisposition = rawHeaders
      .split("\r\n")
      .find((line) => line.toLowerCase().startsWith("content-disposition:"));

    if (!contentDisposition) {
      continue;
    }

    const nameMatch = contentDisposition.match(/name="([^"]+)"/i);
    if (!nameMatch) {
      continue;
    }

    const fieldName = nameMatch[1];
    const filenameMatch = contentDisposition.match(/filename="([^"]*)"/i);
    const contentTypeMatch = rawHeaders.match(/content-type:\s*([^\r\n]+)/i);

    if (filenameMatch && filenameMatch[1]) {
      file = {
        fieldName,
        filename: filenameMatch[1],
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : "application/octet-stream",
        buffer: Buffer.from(rawContent, "latin1"),
      };
      continue;
    }

    fields[fieldName] = rawContent;
  }

  return { fields, file };
}

async function parseIncomingRequest(req) {
  const contentType = getHeaderValue(req.headers, "content-type") || "";

  if (contentType.includes("application/json")) {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    return { fields: body, file: null };
  }

  if (contentType.includes("multipart/form-data")) {
    const rawBody = await readRawBody(req);
    if (!rawBody) {
      throw new Error("Missing multipart body");
    }
    return parseMultipartFormData(contentType, rawBody);
  }

  const body = req.body || {};
  return { fields: body, file: null };
}

function buildEmbed({ name, email, message, imageFilename }) {
  const embed = {
    title: "Contact Message",
    color: 16743903,
    fields: [
      { name: "Name", value: truncate(name, 1024), inline: true },
      { name: "Email", value: truncate(email, 1024), inline: true },
      { name: "Message", value: truncate(message, 4000) },
    ],
    timestamp: new Date().toISOString(),
  };

  if (imageFilename) {
    embed.image = { url: `attachment://${imageFilename}` };
  }

  return embed;
}

function buildDiscordPayload({ name, email, embed, isNewThread }) {
  const payload = {
    embeds: [embed],
  };

  if (isNewThread) {
    payload.thread_name = truncate(`📩 Contact from ${name} (${email})`, 100);
  }

  return payload;
}

async function postToDiscord(webhookUrl, queryParams, payload, file) {
  const url = new URL(webhookUrl);
  url.searchParams.append("wait", "true");

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  let options;

  if (file) {
    const formData = new FormData();
    formData.append("payload_json", JSON.stringify(payload));
    formData.append(
      "files[0]",
      new Blob([file.buffer], { type: file.contentType }),
      file.filename
    );

    options = {
      method: "POST",
      body: formData,
    };
  } else {
    options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  }

  const response = await fetch(url.toString(), options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API error: ${response.status} ${errorText}`);
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const { fields, file } = await parseIncomingRequest(req);
    const name = String(fields.name || "").trim();
    const email = String(fields.email || "").trim();
    const message = String(fields.message || "").trim();
    let actualThreadId = String(fields.threadId || "").trim() || null;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const embed = buildEmbed({
      name,
      email,
      message,
      imageFilename: file?.filename,
    });

    let responseData;

    if (actualThreadId) {
      try {
        responseData = await postToDiscord(
          webhookUrl,
          { thread_id: actualThreadId },
          buildDiscordPayload({ name, email, embed, isNewThread: false }),
          file
        );
      } catch (error) {
        console.log("Failed to post to existing thread, falling back to new thread.", error.message);
        actualThreadId = null;
      }
    }

    if (!actualThreadId) {
      responseData = await postToDiscord(
        webhookUrl,
        {},
        buildDiscordPayload({ name, email, embed, isNewThread: true }),
        file
      );
      actualThreadId = responseData.channel_id || null;
    }

    return res.status(200).json({ ok: true, threadId: actualThreadId });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
