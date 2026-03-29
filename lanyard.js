const DISCORD_ID = "610180321396391947";

async function fetchLanyard() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (!response.ok) throw new Error("API response not ok");
        const json = await response.json();
        if (!json.success) throw new Error("API success boolean false");
        
        updateDiscordCard(json.data);
    } catch (e) {
        console.error("Lanyard fetch failed:", e);
        const wrapper = document.getElementById("discord-card-container");
        if (wrapper && wrapper.style.opacity !== "0") {
            wrapper.style.opacity = "0";
            setTimeout(() => { if(wrapper) { wrapper.style.display = "none"; } }, 500);
        }
    }
}

function updateDiscordCard(data) {
    const wrapper = document.getElementById("discord-card-container");
    const dot = document.getElementById("discord-dot");
    const headerText = document.getElementById("discord-text");
    const activityContainer = document.getElementById("discord-activity");

    if (!wrapper || !dot || !headerText || !activityContainer) return;

    // Status mapping with exact colors
    const statusMap = {
        online: { text: "Online", color: "#43b581" },
        idle: { text: "Idle", color: "#faa61a" },
        dnd: { text: "Do Not Disturb", color: "#f04747" },
        offline: { text: "Offline", color: "#747f8d" }
    };
    
    let status = data.discord_status || "offline";
    if (!statusMap[status]) status = "offline";
    
    const config = statusMap[status];

    dot.style.backgroundColor = config.color;
    dot.style.setProperty("--dot-color", config.color);
    headerText.textContent = `Eduard — ${config.text}`;

    // Activity resolution hierarchy
    let activityHtml = "";
    
    if (data.listening_to_spotify && data.spotify) {
        activityHtml = `<span style="color: #1DB954; font-size: 1.1rem; line-height: 1;">🎵</span> <span style="display:flex; flex-direction:column;"><strong style="color: var(--text-main);">${data.spotify.song}</strong><span style="font-size: 0.8rem; margin-top:2px;">by ${data.spotify.artist}</span></span>`;
        activityContainer.style.display = "flex";
        activityContainer.innerHTML = activityHtml;
    } else if (data.activities && data.activities.length > 0) {
        // Prevent matching custom status (type 4) if a game exists
        const currentActivity = data.activities.find(a => a.type !== 4);
        if (currentActivity) {
            activityHtml = `<span style="font-size: 1.1rem; line-height:1;">🎮</span> <span style="display:flex; flex-direction:column;"><strong style="color: var(--text-main);">${currentActivity.name}</strong><span style="font-size: 0.8rem; margin-top:2px;">${currentActivity.details || currentActivity.state || 'Playing'}</span></span>`;
            activityContainer.style.display = "flex";
            activityContainer.innerHTML = activityHtml;
        } else {
            activityContainer.style.display = "none";
        }
    } else {
        activityContainer.style.display = "none";
    }

    // Reveal container gracefully if obscured
    if (wrapper.style.display === "none" || wrapper.style.opacity === "0") {
        wrapper.style.display = "block";
        // Force reflow
        void wrapper.offsetWidth;
        wrapper.style.opacity = "1";
    }
}

// Initial fetch & loop interval
fetchLanyard();
setInterval(fetchLanyard, 30000);
