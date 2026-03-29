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
    if (!wrapper) return;

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

    const discordUser = data.discord_user;
    const avatarUrl = discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || "0") % 5}.png`;
    
    const displayName = discordUser.display_name || discordUser.username;
    const username = discordUser.username;

    // Build Custom Status Row if Type 4 exists
    let customStatusHtml = "";
    if (data.activities) {
        const customAct = data.activities.find(a => a.type === 4);
        if (customAct && (customAct.emoji || customAct.state)) {
            let emoji = customAct.emoji ? (customAct.emoji.id ? `https://cdn.discordapp.com/emojis/${customAct.emoji.id}.${customAct.emoji.animated ? 'gif' : 'png'}` : customAct.emoji.name) : '';
            let emojiImg = emoji.startsWith('http') ? `<img src="${emoji}" class="discord-custom-emoji" alt="emoji">` : `<span class="discord-custom-emoji">${emoji}</span>`;
            let stateText = customAct.state ? customAct.state : '';
            
            customStatusHtml = `
                <div class="discord-row discord-custom-status">
                    ${emoji ? emojiImg : ''}
                    <i>${stateText}</i>
                </div>
            `;
        }
    }

    // Build Activity Row
    let activityHtml = "";
    if (data.listening_to_spotify && data.spotify) {
        activityHtml = `
            <div class="discord-row discord-activity focus-spotify">
                <span class="activity-icon" style="color: #1DB954;">🎵</span>
                <div class="activity-details">
                    <strong style="color: var(--text-main);">${data.spotify.song}</strong>
                    <span>by ${data.spotify.artist}</span>
                    <div class="spotify-progress-bar"><div class="spotify-progress-inner"></div></div>
                </div>
            </div>
        `;
    } else if (data.activities && data.activities.length > 0) {
        const playingAct = data.activities.find(a => a.type !== 4);
        if (playingAct) {
            activityHtml = `
                <div class="discord-row discord-activity">
                    <span class="activity-icon">🎮</span>
                    <div class="activity-details">
                        <strong style="color: var(--text-main);">${playingAct.name}</strong>
                        <span>${playingAct.details || playingAct.state || 'Playing'}</span>
                    </div>
                </div>
            `;
        }
    }

    // Build Clan/Server Tag Row
    const tagHtml = `
        <div class="discord-row discord-tag">
            <span class="activity-icon">🏷️</span>
            <div class="activity-details">
                <strong style="color: var(--text-main);">Eddy Dev Hub</strong>
            </div>
        </div>
    `;

    // Construct DOM
    wrapper.innerHTML = `
        <div class="discord-card glass-panel" style="--status-color: ${config.color};">
            <div class="discord-header">
                <svg viewBox="0 0 127.14 96.36" class="discord-logo"><path fill="#5865F2" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/></svg>
                <span>DISCORD STATUS</span>
            </div>
            
            <div class="discord-profile-row">
                <div class="discord-avatar-wrapper">
                    <img src="${avatarUrl}" alt="${username} avatar" class="discord-avatar">
                    <span class="status-dot tooltip" style="background-color: ${config.color}; --dot-color: ${config.color};"></span>
                </div>
                <div class="discord-names">
                    <strong class="discord-display-name">${displayName}</strong>
                    <span class="discord-username">@${username}</span>
                </div>
            </div>

            ${customStatusHtml}
            ${activityHtml}
            ${tagHtml}
        </div>
    `;

    // Reveal container gracefully if obscured
    if (wrapper.style.display === "none" || wrapper.style.opacity === "0") {
        wrapper.style.display = "block";
        void wrapper.offsetWidth; // Force reflow
        wrapper.style.opacity = "1";
    }
}

// Init
fetchLanyard();
setInterval(fetchLanyard, 30000);
