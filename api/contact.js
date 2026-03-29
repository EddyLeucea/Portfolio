export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, threadId } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const embed = {
    title: "New Contact Message",
    color: 16743956, // matching #ff7e5f
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "Email", value: email, inline: true },
      { name: "Message", value: message }
    ],
    timestamp: new Date().toISOString()
  };

  let actualThreadId = threadId;

  async function postToDiscord(webhookUrl, queryParams, payload) {
    const url = new URL(webhookUrl);
    url.searchParams.append('wait', 'true');
    Object.keys(queryParams).forEach(key => url.searchParams.append(key, queryParams[key]));

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord API error: ${response.status} ${errorText}`);
    }
    return response.json();
  }

  try {
    let responseData;

    if (actualThreadId) {
       try {
           responseData = await postToDiscord(webhookUrl, { thread_id: actualThreadId }, { embeds: [embed] });
       } catch (err) {
           console.log("Failed to post to existing thread, falling back to new thread.", err.message);
           actualThreadId = null;
       }
    }

    if (!actualThreadId) {
        responseData = await postToDiscord(webhookUrl, {}, {
            thread_name: `📩 Contact from ${name} (${email})`,
            embeds: [embed]
        });
        actualThreadId = responseData.channel_id; // For forum channels, channel_id is the thread ID
    }

    res.status(200).json({ ok: true, threadId: actualThreadId });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}
