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

    // Construct DOM
    wrapper.innerHTML = `
        <div class="about-photo-card glass-panel" style="border-color: ${config.color}; box-shadow: 0 8px 32px 0 ${config.color}40; transition: all 0.5s ease; max-width: 450px; margin: 0 auto;">
            <div class="about-photo-frame" style="border-color: ${config.color}80; transition: all 0.5s ease;">
                <img src="./AboutMePhoto.png" alt="Eduard Leucea" class="about-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
                <div class="about-photo-fallback">
                    <span>AboutMePhoto.png</span>
                    <p>Add your personal photo here for the final portfolio version.</p>
                </div>
            </div>
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
