// ============================================================
// GLOBAL STATE
// Tracks current game session: loaded missions, active player,
// database session token, and selected save slot.
// ============================================================
let dbSessionToken = "";
let selectedSaveName = "";
let player = null;  // Instance of Player class
const backgroundMusic = new Audio(
    "http://127.0.0.1:5000/static/flightGameMainTheme.mp3"
);
backgroundMusic.loop = true;
backgroundMusic.volume = 0.7; // default volume
// ============================================================
// PLAYER CLASS
// Encapsulates all player-related data and logic
// ============================================================
class Player {
    constructor(name) {
        this.name = name;
        this.location = null;
        this.bases = [];
        this.missions = [];
        this.money = 0;
        this.co2_remaining = 0;
        this.selectedBase = null;
        this.selectedMission = null;
    }

    async loadGameState() {
        const data = await fetchJson(`/api/game-state?player=${encodeURIComponent(this.name)}`);
        this.money = data.money;
        this.co2_remaining = data.co2_remaining;
        this.location = {
            lat: Number(data.location_lat),
            lon: Number(data.location_lon),
            airport: data.location_airport,
            country: data.location_country,
            ident: data.location_ident
        };
        creditsEl.textContent = String(this.money);
        co2BudgetEl.textContent = String(this.co2_remaining);
        if (hasValidCoords(this.location.lat, this.location.lon)) {
            drawPlayerLocationMarker();
        }
        console.log("Player location:", this.location);
        console.log("Bases:", this.bases);
        console.log("isAtHomebase:", this.isAtHomebase());
        if (this.isAtHomebase()) {
            this.updateSelectedBase();
            console.log("Selected base:", this.selectedBase);
        }
    }

    async loadBases() {
        const data = await fetchJson(`/api/bases?player=${encodeURIComponent(this.name)}`);
        this.bases = Array.isArray(data.bases) ? data.bases : [];
        console.log(this.bases);
    }

    async loadMissions() {
        routeLabelEl.textContent = "Loading missions from backend...";
        try {
            const data = await fetchJson(`/api/callMissions?player=${encodeURIComponent(this.name)}&count=5`);
            this.missions = Array.isArray(data.missions) ? data.missions : [];
            console.log(this.missions);
            if (this.missions.length === 0) {
                missionListEl.innerHTML = "<p class='mission-meta'>No missions available right now.</p>";
                routeLabelEl.textContent = "No route available";
                flightStatusEl.textContent = "Idle";
            }
        } catch (error) {
            console.log(error.message);
            missionListEl.innerHTML = "<p class='mission-meta'>Could not load missions. Try refresh.</p>";
            routeLabelEl.textContent = "Mission load failed";
            flightStatusEl.textContent = "Mission service unavailable";
        }
    }

    isAtHomebase() {
        if (!this.location || this.bases.length === 0) return false;
        return this.bases.some(base => base.ident === this.location.ident);
    }

    isAtSpecificHomebase(baseIdent) {
        return !!(
            this.location &&
            this.location.ident === baseIdent
        );
    }


    getSelectedBase() {
        if (!this.location) return null;
        return this.bases.find(base => base.ident === this.location.ident) || null;
    }

    updateSelectedBase() {
        this.selectedBase = this.getSelectedBase();
        return this.selectedBase;
    }
}

// ============================================================
// DOM REFERENCES – Auth & Save Selection Screens
// ============================================================
const authOverlayEl = document.getElementById("authOverlay");
const saveOverlayEl = document.getElementById("saveOverlay");
const gameAppEl = document.getElementById("gameApp");
const dbAuthStatusEl = document.getElementById("dbAuthStatus");
const saveStatusEl = document.getElementById("saveStatus");

// DB login form inputs
const dbLoginFormEl = document.getElementById("dbLoginForm");
const dbHostEl = document.getElementById("dbHost");
const dbPortEl = document.getElementById("dbPort");
const dbUserEl = document.getElementById("dbUser");
const dbPasswordEl = document.getElementById("dbPassword");
const dbNameEl = document.getElementById("dbName");
const refreshSavesBtnEl = document.getElementById("refreshSavesBtn");
const continueBtnEl = document.getElementById("continueBtn");
const deleteSaveBtnEl = document.getElementById("deleteSaveBtn");
const createSaveBtnEl = document.getElementById("createSaveBtn");
const newSaveNameEl = document.getElementById("newSaveName");
const saveListEl = document.getElementById("saveList");

// ============================================================
// DOM REFERENCES – In-Game UI (missions, map, HUD)
// ============================================================
const missionListEl = document.getElementById("missionList");
const captionListEl = document.getElementById("captionList");
const baseListEl = document.getElementById("baseList");
const baseActionsEl = document.getElementById("baseActions");
const missionBasetglEl = document.getElementById("missionBasetgl");
const missionPanelTitleEl = document.getElementById("missionPanelTitle");
const missionPanelSubtitleEl = document.getElementById("missionPanelSubtitle");
const routeLabelEl = document.getElementById("routeLabel");
const flightStatusEl = document.getElementById("flightStatus");
const flightProgressEl = document.getElementById("flightProgress");
const creditsEl = document.getElementById("credits");
const co2BudgetEl = document.getElementById("co2Budget");
const playerNameEl = document.getElementById("playerName");
const backToSavesBtn = document.getElementById("backToSavesBtn");
const refreshMissionsBtn = document.getElementById("refreshMissionsBtn");
const settingsBtn = document.getElementById("settingsBtn");

// ============================================================
// MODAL SYSTEM – Reusable popup for base actions & menus
// ============================================================

// Creates modal container if it doesn't exist
function ensureModalExists() {
    if (document.getElementById("actionModal")) return;
    const modal = document.createElement("div");
    modal.id = "actionModal";
    modal.className = "action-modal hidden";
    modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content glass">
      <div class="modal-header">
        <h3 id="modalTitle">Action</h3>
        <button class="modal-close-btn" id="modalCloseBtn">✕</button>
      </div>
      <div id="modalBody" class="modal-body"></div>
    </div>
  `;
    document.body.appendChild(modal);
}

// Opens modal with title and content
function openModal(title, contentHTML) {
    ensureModalExists();
    const modal = document.getElementById("actionModal");
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalBody").innerHTML = contentHTML;
    modal.classList.remove("hidden");

    // Close on overlay click
    modal.querySelector(".modal-overlay").onclick = closeModal;
    document.getElementById("modalCloseBtn").onclick = closeModal;
}

// Closes the modal
function closeModal() {
    const modal = document.getElementById("actionModal");
    if (modal) {
        modal.classList.add("hidden");
        document.getElementById("modalBody").innerHTML = "";
    }
}

// ============================================================
// SETTINGS MODAL – Music Volume Control Only
// ============================================================

function openMusicSettingsModal() {
    openModal(
        "Audio Settings",
        `
    <div class="audio-settings">
      <p>Music Volume</p>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value="${backgroundMusic.volume}"
        id="musicVolumeSlider"
      />
    </div>
    `
    );

    const slider = document.getElementById("musicVolumeSlider");
    if (slider) {
        slider.addEventListener("input", () => {
            backgroundMusic.volume = slider.value;
            localStorage.setItem("musicVolume", slider.value);
        });
    }
}

// ============================================================
// LEAFLET MAP SETUP
// Initialises the interactive map centered on Europe,
// adds the OpenStreetMap tile layer, and moves zoom controls
// to the bottom-right corner.
// ============================================================
const map = L.map("map", {
    zoomControl: false
}).setView([50.8, 12.5], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

L.control.zoom({position: "bottomright"}).addTo(map);

// ============================================================
// MAP OBJECT STATE
// References to Leaflet layers & markers currently on the map,
// plus flight animation state.
// ============================================================
let activeRoute = null;   // polyline: mission route (from -> to)
let preRoute = null;      // polyline: player location -> mission start
let fromMarker = null;    // marker at mission origin airport
let toMarker = null;      // marker at mission destination airport
let planeMarker = null;   // animated plane icon during flight
let playerMarker = null;  // player's current location marker
let animationFrameId = null;
let isFlying = false;

// ============================================================
// UTILITY HELPERS
// ============================================================

// Function that returns an array of elements whose text content includes the given text
function getElementsByText(text) {
    function rec(ele, arr) {
        if (ele.childNodes.length > 0)
            for (var i = 0; i < ele.childNodes.length; i++)
                rec(ele.childNodes[i], arr);
        else if (ele.nodeType == Node.TEXT_NODE &&
            ele.nodeValue.indexOf(text) != -1)
            arr.push(ele.parentNode);
        return arr;
    }

    return rec(document.body, []);
}

// Returns true when both lat and lon are real finite numbers
function hasValidCoords(lat, lon) {
    return Number.isFinite(lat) && Number.isFinite(lon);
}

// Formats a number as in-game currency, e.g. "1,200 €"
function formatMoney(n) {
    return `${n.toLocaleString("en-US")} €`;
}

// Calculates total payout for a mission
function missionTotal(m) {
    return m.cargoAmount * m.payRate;
}

// Forces Leaflet to recalculate map dimensions after layout changes
function refreshMapSize() {
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 120);
    setTimeout(() => map.invalidateSize(), 320);
}

// Generates a button for missions start and other actions
function renderButton(text, onClick) {
    const btnbox = document.getElementById("missionActions");
    if (!btnbox) return null;
    const btn = document.createElement("button");
    btn.className = "mission-btn";
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    btnbox.appendChild(btn);
    return btn;
}

function clearButtons() {
    const box = document.getElementById("missionActions");
    if (box) box.replaceChildren();
}


function typewriterText(element, text, speed = 30) {
    element.textContent = "";
    let index = 0;

    function tick() {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
            setTimeout(tick, speed);
        }
    }

    tick();
}

// ============================================================
// GAME OVER / GAME WON
// ============================================================

async function endGame() {
    await fetchJson("/api/end-game", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({player: player.name})
    });

    showGameOverScreen();
}

function showGameOverScreen() {
    openModal(
        "Game Over",
        `
      <p class="menu-info">Your journey has ended.</p>
      <button class="menu-btn" onclick="goBackToSaves(), closeModal()">Return to Saves</button>
    `
    );
    stopFlightAnimation();
    player = null;
}

function gameWon(message) {

    const content = `
      <div class="game-won-screen">
        <p class="menu-info">YOU BEAT THE SYSTEM</p>
        <p id="gamewontext"></p>
        <button class="menu-btn" onclick="closeModal()">Close</button>
      </div>
    `;
    openModal("Game Won", content);
    const gamewonEL = document.getElementById("gamewontext");
    if (gamewonEL) {
      typewriterText(gamewonEL, message, 25);
    }

  }

// ============================================================
// UI PANEL TOGGLING
// Switches the right panel between different elements.
// ============================================================

// Appends a timestamped line to the captain's log feed
function appendCaption(text) {
    const line = document.createElement("article");
    line.className = "caption-line";
    line.textContent = text;
    captionListEl.appendChild(line);
    captionListEl.scrollTop = captionListEl.scrollHeight;
}

// Switches panel to the "Captain Log" live feed view
function showCaptainLog(mission) {
    missionPanelTitleEl.textContent = "Captain Log";
    missionPanelSubtitleEl.textContent = `Live flight feed for ${mission.Name}`;
    missionListEl.classList.add("hidden");
    captionListEl.classList.remove("hidden");
    baseListEl.classList.add("hidden");
    baseActionsEl.classList.add("hidden");
    baseActionsEl.innerHTML = "";
    // captionListEl.innerHTML = "";
    refreshMapSize();
    clearButtons();
}

function showMissionContract(mission) {
    clearCaptainLog();
    missionPanelTitleEl.textContent = "";
    missionPanelSubtitleEl.textContent = "";
    captionListEl.classList.remove("hidden");
    missionListEl.classList.add("hidden");
    baseListEl.classList.add("hidden");
    missionBasetglEl.classList.add("hidden");
    baseActionsEl.classList.add("hidden");
    baseActionsEl.innerHTML = "";


    const contractTXT = `
      Mission contract for: ${mission.Name} \n
      This mission is considered ${mission.legal ? "not risky" : "risky"} \n
      Mission starts from ${mission.Location[0][0]} ${mission.Location[0][1]} \n
      The end destination is in ${mission.Destination[0][0]} ${mission.Destination[0][1]} \n
      The type of cargo you will be flying is ${mission.cargo} \n
      ${mission.legal ? (mission.cargo == "Humans" ? `Amount of passengers: ${mission.cargoAmount}` : `Amount of cargo: ${mission.cargoAmount}Tonne`) : (mission.cargo == "Illegal Humans" ? `Amount of passengers: ${mission.cargoAmount}` : `Amount of cargo: ${mission.cargoAmount}KG`)} \n
      ${mission.legal ? (mission.cargo == "Humans" ? `Mission will pay: ${mission.payRate}€ per passenger` : `Mission will pay: ${mission.payRate}€ per Tonne`) : (mission.cargo == "Illegal Humans" ? `Mission will pay: ${mission.payRate}€ per passenger` : `Mission will pay: ${mission.payRate}€ per KG`)}
  `
    appendCaption(contractTXT)
    clearButtons();
    renderButton("Start Mission", startSelectedMission)
    renderButton("Change Mission", showMissionSelection)
}

function clearCaptainLog() {
    captionListEl.innerHTML = "";
}

// Switches panel back to the mission selection list
function showMissionSelection() {
    missionPanelTitleEl.textContent = "Available Missions";
    missionPanelSubtitleEl.textContent = "Tap a mission to preview route and payout.";
    captionListEl.classList.add("hidden");
    missionListEl.classList.remove("hidden");
    baseListEl.classList.add("hidden");
    baseActionsEl.classList.add("hidden");
    baseActionsEl.innerHTML = "";
    missionBasetglEl.classList.remove("hidden");
    missionBasetglEl.classList.remove("active");
    missionBasetglEl.textContent = "Select Bases";
    refreshMapSize();
    clearButtons();

    if (player && player.isAtHomebase()) {
        renderButton("Base Actions", () => showbaseActions());
    }
}

function showBaseselection() {
    missionPanelTitleEl.textContent = "Select Base";
    missionPanelSubtitleEl.textContent = "Choose your home airport to start flying.";
    captionListEl.classList.add("hidden");
    missionListEl.classList.add("hidden");
    baseListEl.classList.remove("hidden");
    missionBasetglEl.classList.remove("hidden");
    missionBasetglEl.classList.add("active");
    missionBasetglEl.textContent = "Show Missions";
    baseActionsEl.classList.add("hidden");
    baseActionsEl.innerHTML = "";
    loadBases();
    refreshMapSize();
    clearButtons();
    if (player && player.selectedBase) {
        renderButton("Base Actions", () => showbaseActions());
    }
}

function showbaseActions(base = null) {
    const selectedBase = base || player.selectedBase;
    if (!selectedBase) return;


    if (!player.isAtSpecificHomebase(selectedBase.ident)) {
        openModal(
            "Access denied",
            "<p class='menu-error'>You must be at the base to access its management.</p>"
        );
        return;
    }


    missionPanelTitleEl.textContent = `Home Base: ${selectedBase.airport}`;
    missionPanelSubtitleEl.textContent = "Manage your base and plane";
    baseActionsEl.classList.remove("hidden");
    captionListEl.classList.add("hidden");
    missionListEl.classList.add("hidden");
    baseListEl.classList.add("hidden");
    missionBasetglEl.classList.remove("hidden");
    missionBasetglEl.classList.remove("active");
    missionBasetglEl.textContent = "Back to Missions";
    clearButtons();
    document.getElementById("missionActions").classList.add("hidden");
    refreshMapSize();
    baseActionsEl.innerHTML = "";

    const baseImg = document.createElement("img");
    baseImg.src = "http://127.0.0.1:5000/static/images/" + selectedBase.ident + ".png";
    console.log(baseImg.src);
    baseImg.alt = `${selectedBase.airport} image`;
    baseImg.className = "base-image";
    baseActionsEl.appendChild(baseImg);

    const baseActionbtnsEl = document.createElement("div");
    baseActionbtnsEl.className = "base-action-btns";

    const checkPlantsBtn = document.createElement("button");
    checkPlantsBtn.className = "mission-btn";
    checkPlantsBtn.textContent = "Check Plants";
    checkPlantsBtn.addEventListener("click", () => checkPlants(selectedBase.ident));
    baseActionbtnsEl.appendChild(checkPlantsBtn);

    const upgradeBtn = document.createElement("button");
    upgradeBtn.className = "mission-btn";
    upgradeBtn.textContent = "Upgrade Plane";
    upgradeBtn.addEventListener("click", () => upgradePlane());
    baseActionbtnsEl.appendChild(upgradeBtn);

    const buyNewBaseBtn = document.createElement("button");
    buyNewBaseBtn.className = "mission-btn";
    buyNewBaseBtn.textContent = "Buy New Bases";
    buyNewBaseBtn.addEventListener("click", () => listNewBasesForSale());
    baseActionbtnsEl.appendChild(buyNewBaseBtn);

    baseActionsEl.appendChild(baseActionbtnsEl);
}

function toggleBaseSelection() {
    if (baseActionsEl && !baseActionsEl.classList.contains("hidden")) {
        showMissionSelection();
        return;
    }

    missionBasetglEl.classList.toggle("active");
    if (missionBasetglEl.classList.contains("active")) {
        missionBasetglEl.textContent = "Show Missions";
        showBaseselection();
    } else {
        missionBasetglEl.textContent = "Select Bases";
        showMissionSelection();
    }
}

missionBasetglEl.addEventListener("click", toggleBaseSelection);

// ============================================================
// MAP DRAWING
// Functions that add/remove markers and route lines on the map.
// ============================================================

// Removes all mission-related layers from the map
function clearMapObjects() {
    if (activeRoute) map.removeLayer(activeRoute);
    if (preRoute) map.removeLayer(preRoute);
    if (fromMarker) map.removeLayer(fromMarker);
    if (toMarker) map.removeLayer(toMarker);
    if (planeMarker) map.removeLayer(planeMarker);

    activeRoute = null;
    preRoute = null;
    fromMarker = null;
    toMarker = null;
    planeMarker = null;
}

// Places (or updates) the player's current-position marker on the map
function drawPlayerLocationMarker() {
    if (!player || !player.location || !hasValidCoords(player.location.lat, player.location.lon)) {
        return;
    }

    const point = [player.location.lat, player.location.lon];
    if (!playerMarker) {
        playerMarker = L.marker(point, {
            icon: L.divIcon({
                className: "",
                html: '<div class="player-marker">📍</div>',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            })
        }).addTo(map);
    } else {
        playerMarker.setLatLng(point);
    }
    playerMarker.bindPopup(`You are here: ${player.location.airport}, ${player.location.country}`);
}

// Draws the full route for a mission: player -> pickup -> destination
function drawMission(mission) {
    player.selectedMission = mission;
    clearMapObjects();

    drawPlayerLocationMarker();

    const origin = player.location && hasValidCoords(player.location.lat, player.location.lon)
        ? [player.location.lat, player.location.lon]
        : [mission.Location[0][2], mission.Location[0][3]];

    const from = [mission.Location[0][2], mission.Location[0][3]];
    const to = [mission.Destination[0][2], mission.Destination[0][3]];

    fromMarker = L.marker(from, {
        icon: L.divIcon({
            className: "",
            html: '<div class="start-marker"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        })
    }).addTo(map).bindPopup(`Start: ${mission.Location[0][0]}, ${mission.Location[0][1]}`);

    toMarker = L.marker(to, {
        icon: L.divIcon({
            className: "",
            html: '<div class="dest-marker"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        })
    }).addTo(map).bindPopup(`Destination: ${mission.Destination[0][0]}, ${mission.Destination[0][1]}`);

    preRoute = L.polyline([origin, from], {
        color: "#1f6687",
        weight: 3,
        dashArray: "6 8"
    }).addTo(map);

    activeRoute = L.polyline([from, to], {
        color: mission.legal ? "#1f6687" : "#d14a1f",
        weight: 4,
        dashArray: mission.legal ? "0" : "8 8"
    }).addTo(map);

    const bounds = L.featureGroup([preRoute, activeRoute]).getBounds();
    map.fitBounds(bounds, {padding: [40, 40]});
    routeLabelEl.textContent = `${mission.Name}: Your Location -> ${mission.Location[0][0]} -> ${mission.Destination[0][0]}`;
    flightStatusEl.textContent = "Ready for departure";
    flightProgressEl.style.width = "0%";
}

// ============================================================
// FLIGHT ANIMATION
// Animates the plane marker along the route during a mission.
// ============================================================

// Interpolates the plane marker between two points (t = 0..1)
function setPlanePosition(start, end, t) {
    const lat = start.lat + (end.lat - start.lat) * t;
    const lon = start.lon + (end.lon - start.lon) * t;
    const point = [lat, lon];

    if (!planeMarker) {
        planeMarker = L.marker(point, {
            icon: L.divIcon({
                className: "",
                html: '<div class="plane-marker">🛩️</div>',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            })
        }).addTo(map);
    } else {
        planeMarker.setLatLng(point);
    }
}

// Cancels the running animation loop and re-enables the start button
function stopFlightAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    isFlying = false;
}

// ============================================================
// BACKEND API COMMUNICATION
// All fetch calls go through fetchJson(), which attaches the
// DB session token header automatically.
// ============================================================

// Generic JSON fetcher – attaches session token & handles errors
async function fetchJson(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };
    if (dbSessionToken) {
        headers["X-DB-Session"] = dbSessionToken;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `HTTP ${response.status}`);
    }
    return response.json();
}

// ============================================================
// SAVE MANAGEMENT
// Lists, creates, and deletes pilot save slots.
// ============================================================

// Renders the list of save-game cards in the save selection screen
function renderSaveList(saves) {
    saveListEl.innerHTML = "";
    selectedSaveName = "";
    continueBtnEl.disabled = true;
    deleteSaveBtnEl.disabled = true;

    if (!Array.isArray(saves) || saves.length === 0) {
        saveListEl.innerHTML = "<p class='mission-meta'>No saves found. Create one in terminal game first.</p>";
        return;
    }

    saves.forEach((save) => {
        const card = document.createElement("article");
        card.className = "save-card";
        card.innerHTML = `
      <h3>${save.pilot}</h3>
      <p>Money: ${formatMoney(save.money)}</p>
      <p>CO2 remaining: ${save.co2_remaining}</p>
    `;

        card.addEventListener("click", () => {
            document.querySelectorAll(".save-card").forEach((el) => el.classList.remove("active"));
            card.classList.add("active");
            selectedSaveName = save.pilot;
            continueBtnEl.disabled = false;
            deleteSaveBtnEl.disabled = false;
        });

        saveListEl.appendChild(card);
    });
}

// Fetches all saves from backend and renders them
async function loadSaves() {
    saveStatusEl.textContent = "Loading saves...";
    const data = await fetchJson("/api/saves");
    renderSaveList(data.saves || []);
    saveStatusEl.textContent = "Select save to continue";
}

// ============================================================
// GAME STATE
// Loads the player's current money, CO2 budget, and location
// from the backend and updates the HUD.
// ============================================================
async function loadGameState() {
    await player.loadGameState();
}

// ============================================================
// MISSION LIST RENDERING
// Builds and displays the clickable mission cards.
// ============================================================

function createMissionCard(mission, index) {
    const isRisky = !mission.legal;

    const card = document.createElement("article");
    card.className = `mission-card ${isRisky ? "risky" : ""}`;
    card.style.animationDelay = `${index * 80}ms`;

    const cargoUnit =
        typeof mission.cargo === "string" && mission.cargo.includes("Humans")
            ? "passengers"
            : "units";

    card.innerHTML = `
    <h3 class="mission-title">${mission.Name}</h3>
    <p class="mission-meta">${mission.Location[0][1]} -> ${mission.Destination[0][1]}</p>
    <p class="mission-meta">Cargo: ${mission.cargoAmount} ${cargoUnit} (${mission.cargo})</p>
    <div class="meta-row">
      <span class="tag ${isRisky ? "risky" : ""}">${isRisky ? "RISKY" : "NO RISK"}</span>
      <span class="pay">${formatMoney(missionTotal(mission))}</span>
    </div>
  `;

    card.addEventListener("click", () => {
        stopFlightAnimation();
        //Tuplaklikkaamalla avaa tehtävän muuten se valitsee sen pikanäkymään :)
        if (card.classList.contains("active")) {
            showMissionContract(mission)
        } else {
            document.querySelectorAll(".mission-card").forEach((el) =>
                el.classList.remove("active")
            );

            card.classList.add("active");
            drawMission(mission);
        }
    });

    return card;
}

// Renders the full mission list and auto-selects the first one
function renderMissionList() {
    console.log("renderaus alotettu");
    missionListEl.innerHTML = "";
    player.missions.forEach((mission, idx) => {
        console.log(mission);
        missionListEl.appendChild(createMissionCard(mission, idx));
    });

    const firstCard = missionListEl.querySelector(".mission-card");
    if (firstCard && player.missions.length > 0) {
        firstCard.classList.add("active");
        drawMission(player.missions[0]);
    }
}

// Fetches missions from backend for the current player
async function loadMissions() {
    await player.loadMissions();
    renderMissionList();
}

// ============================================================
// Base cards rendering
// ============================================================

// makes the card for the base selection screen
function createBaseCard(base) {
    const card = document.createElement("article");
    card.className = "mission-card";
    card.innerHTML = `
    <h3 class="mission-title">${base.airport}</h3>
    <p class="mission-meta">${base.country}</p>
  `;

    card.addEventListener("click", () => {
        stopFlightAnimation();

        if (card.classList.contains("active") && player.selectedBase && player.selectedBase.ident === base.ident) {
            startHomebaseFlight(base);
            return;
        }

        document.querySelectorAll(".mission-card").forEach((el) =>
            el.classList.remove("active")
        );

        player.selectedBase = base;
        card.classList.add("active");
        clearMapObjects();
        drawPlayerLocationMarker();
        clearButtons();
        renderButton("Base Actions", () => showbaseActions(base));

        const baseLat = base.lat;
        const baseLon = base.lon;

        fromMarker = L.marker([baseLat, baseLon], {
            icon: L.divIcon({
                className: "marker-icon",
                html: '<div class="start-marker"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })
        }).addTo(map).bindPopup(`${base.airport} (${base.country})`).openPopup();

        if (player.location && hasValidCoords(player.location.lat, player.location.lon)) {
            preRoute = L.polyline(
                [[player.location.lat, player.location.lon], [baseLat, baseLon]],
                {color: "#1f6687", weight: 3, dashArray: "6 8"}
            ).addTo(map);
            map.fitBounds(preRoute.getBounds(), {padding: [40, 40]});
        } else {
            map.setView([baseLat, baseLon], 6);
        }

        routeLabelEl.textContent = `Base: ${base.airport} (${base.country})`;
    });
    return card;
}

// Renders the list of available bases in the base selection screen
function renderBaseList() {
    console.log("basejen renderöinti aloitettu");
    baseListEl.innerHTML = "";
    player.bases.forEach((base) => {
        console.log(base);
        baseListEl.appendChild(createBaseCard(base));
    });
}

// Fetches available bases from backend and renders them
async function loadBases() {
    routeLabelEl.textContent = "Loading bases from backend...";
    try {
        await player.loadBases();
        renderBaseList();
    } catch (error) {
        console.log(error.message);
        baseListEl.innerHTML = "<p class='mission-meta'>Could not load bases. Try refresh.</p>";
        routeLabelEl.textContent = "Base load failed";
    }
}

// Creates a new save with the name entered in the input field
async function createSave() {
    const pilot = newSaveNameEl.value.trim();
    if (!pilot) {
        saveStatusEl.textContent = "Enter a pilot name first.";
        return;
    }

    saveStatusEl.textContent = "Creating save...";

  // STORE THE RESPONSE
  const response = await fetchJson("/api/create_save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pilot })
  });

  if (response.lore) {
    openModal(
  "Pilot Lore",
  `
    <div class="lore-modal">
      <p id="loreText" class="lore-text"></p>
      <button class="menu-btn" onclick="closeModal()">Continue</button>
    </div>
  `
        );
    }

// START TYPEWRITER AFTER MODAL IS OPENED TO ENSURE THE ELEMENT EXISTS
    const loreEl = document.getElementById("loreText");
    if (loreEl) {
        typewriterText(loreEl, response.lore, 28);
    }
    ``

    newSaveNameEl.value = "";
    await loadSaves();
    saveStatusEl.textContent = `Save created: ${pilot}`;
}

// Deletes the currently highlighted save after user confirmation
async function deleteSelectedSave() {
    if (!selectedSaveName) {
        return;
    }

    const confirmed = window.confirm(`Delete save '${selectedSaveName}'?`);
    if (!confirmed) {
        return;
    }

    await fetchJson("/api/delete_save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({pilot: selectedSaveName})
    });

    saveStatusEl.textContent = `Deleted save: ${selectedSaveName}`;
    selectedSaveName = "";
    continueBtnEl.disabled = true;
    deleteSaveBtnEl.disabled = true;
    await loadSaves();
}

// ============================================================
// MISSION EXECUTION
// Handles the full flight sequence: animation, captain log
// messages, and backend completion call.
// ============================================================

// Sends the completed mission to the backend to update stats
async function completeMissionOnBackend(mission) {
    return fetchJson("/api/start-mission", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            player: player.name,
            mission
        })

    });
}

// Sends the completed homebase flight to the backend to update location and CO2 usage
async function completeHomebaseOnBackend(base) {
    const response = await fetchJson("/api/start-homebase", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            player: player.name,
            base
        })
    });

    if (response) {
        creditsEl.textContent = String(response.money);
        co2BudgetEl.textContent = String(response.co2_remaining);
    }

    return response;
}

function startHomebaseFlight(base) {
    if (!base || isFlying) return;

    stopFlightAnimation();
    showCaptainLog({Name: base.airport});
    appendCaption(`Homebase flight accepted: ${base.airport}`);

    isFlying = true;
    flightStatusEl.textContent = `In flight to home base: ${base.airport}`;
    routeLabelEl.textContent = `Flying home: ${base.airport}`;

    const basePoint = {lat: base.lat, lon: base.lon};
    const startPoint = player.location && hasValidCoords(player.location.lat, player.location.lon)
        ? {lat: player.location.lat, lon: player.location.lon}
        : basePoint;

    const totalDurationMs = 14000;
    const startTime = performance.now();

    clearMapObjects();
    drawPlayerLocationMarker();

    activeRoute = L.polyline([
        [startPoint.lat, startPoint.lon],
        [basePoint.lat, basePoint.lon]
    ], {
        color: "#1f6687",
        weight: 4,
        dashArray: "8 6"
    }).addTo(map);

    const bounds = L.featureGroup([activeRoute]).getBounds();
    map.fitBounds(bounds, {padding: [40, 40]});

    let isPaused = false;
    let pauseStartTime = 0;
    let totalPausedTime = 0;
    const milestones = new Set();

    async function step(now) {
        if (isPaused) {
            animationFrameId = requestAnimationFrame(step);
            return;
        }

        const elapsed = now - startTime - totalPausedTime;
        const progress = Math.min(elapsed / totalDurationMs, 1);

        if (progress > 0.99 && !milestones.has("landing-event")) {
            milestones.add("landing-event");
            const x = Math.floor(Math.random() * 5);
            console.log(x);
            if (x == 2) {
              isPaused = true;
              pauseStartTime = performance.now();

              await randomEvent("homeBase", 0);

              totalPausedTime += performance.now() - pauseStartTime;
              isPaused = false;
            }
        }

        setPlanePosition(startPoint, basePoint, progress);
        flightProgressEl.style.width = `${Math.floor(progress * 100)}%`;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(step);
            return;
        }

        // 🛬 LANDING
        stopFlightAnimation();
        appendCaption(`Landed at home base`);

        await completeHomebaseOnBackend(base);
        await loadGameState();
        isFlying = false;
        flightStatusEl.textContent = "Arrived"

        showbaseActions();
    }

    animationFrameId = requestAnimationFrame(step);
}

//=============================================================
// Base action menu helpers
//=============================================================

function formatPlantModal(baseIdent, currentPlants) {
    return `
    <div class="plant-menu">
      <p class="menu-info">
        Plant Status: <strong>${currentPlants}</strong>
      </p>

      <label class="slider-label">
        Amount to trade:
        <span id="plantAmountValue">${currentPlants}</span>

        <input
          id="plantSlider"
          class="plants-slider"
          type="range"
          min="0"
          max="250"
          value="${currentPlants}"
          oninput="
            document.getElementById('plantAmountValue').textContent = this.value;
            document.getElementById('buyPlantsBtn').textContent =
              'Buy Plants (' + (this.value * 80) + '€)';
            document.getElementById('sellPlantsBtn').textContent =
              'Sell Plants (' + (this.value * 50) + '€)';
          "
        />
      </label>

      <div class="menu-button-row">
        <button id="buyPlantsBtn" class="menu-btn" type="button">
          Buy Plants (${currentPlants * 80}€)
        </button>

        <button id="sellPlantsBtn" class="menu-btn" type="button">
          Sell Plants (${currentPlants * 50}€)
        </button>
      </div>

      <button class="menu-btn" type="button" onclick="closeModal()">Close</button>
    </div>
  `;
}

function attachPlantModalListeners(baseIdent) {
    const buyButton = document.getElementById("buyPlantsBtn");
    const sellButton = document.getElementById("sellPlantsBtn");
    const slider = document.getElementById("plantSlider");

    if (buyButton) {
        buyButton.addEventListener("click", () => handlePlantTrade("buy", slider ? slider.value : 0, baseIdent));
    }
    if (sellButton) {
        sellButton.addEventListener("click", () => handlePlantTrade("sell", slider ? slider.value : 0, baseIdent));
    }
}

async function checkPlants(baseIdent) {
    try {
        const data = await fetchJson(`/api/check-plants?base=${baseIdent}&player=${encodeURIComponent(player.name)}`);
        openModal("Plant Management", formatPlantModal(baseIdent, data.plants));
        attachPlantModalListeners(baseIdent);
    } catch (error) {
        console.error("Error checking plants:", error);
        openModal("Plant Management", "<p class='menu-error'>Failed to check plants.</p>");
    }
}

async function handlePlantTrade(action, amount, baseIdent) {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        openModal("Plant Management", "<p class='menu-error'>Enter a valid plant amount first.</p>");
        return;
    }

    try {
        const data = await fetchJson("/api/plant-trade", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                player: player.name,
                base: baseIdent,
                action,
                amount: parsedAmount
            })
        });

        player.money = data.money;
        creditsEl.textContent = String(data.money);
        openModal(
            "Plant Management",
            `
        <div class="plant-menu">
          <p class="menu-info">${data.message}</p>
          <p class="menu-info">Plants now: <strong>${data.plants}</strong></p>
          <p class="menu-info">Balance: <strong>${formatMoney(data.money)}</strong></p>
          <button class="menu-btn" type="button" onclick="closeModal()">Close</button>
        </div>
      `
        );
    } catch (error) {
        openModal("Plant Management", `<p class='menu-error'>${error.message}</p>`);
    }
}

async function upgradePlane() {
    try {
        const levelsData = await fetchJson(`/api/get-plane-levels?player=${encodeURIComponent(player.name)}`);
        const levels = levelsData.levels;

        const content = `
      <div class="upgrade-menu">
        <div class="upgrade-header">
          <div>
            <p class="upgrade-title">Plane Upgrades</p>
            <p class="upgrade-balance">Balance: <strong>${formatMoney(player.money)}</strong></p>
          </div>
        </div>
        <div class="upgrade-grid">
          <div class="upgrade-card">
            <p class="upgrade-name">Hull</p>
            <p class="upgrade-level">Level ${levels.ruuma}/5</p>
            <button class="menu-btn upgrade-action" onclick="upgradePlanePart('ruuma')">Upgrade 1000€</button>
          </div>
          <div class="upgrade-card">
            <p class="upgrade-name">Seats</p>
            <p class="upgrade-level">Level ${levels.istuinpaikat}/5</p>
            <button class="menu-btn upgrade-action" onclick="upgradePlanePart('istuinpaikat')">Upgrade 1000€</button>
          </div>
          <div class="upgrade-card">
            <p class="upgrade-name">Engine</p>
            <p class="upgrade-level">Level ${levels.moottori}/5</p>
            <button class="menu-btn upgrade-action" onclick="upgradePlanePart('moottori')">Upgrade 1000€</button>
          </div>
        </div>
      </div>
    `;
        openModal("Plane Upgrade", content);
    } catch (error) {
        console.error("Error loading plane levels:", error);
        const content = `
      <div class="upgrade-menu">
        <p class="menu-error">Failed to load plane levels.</p>
        <button class="menu-btn" onclick="closeModal()">Close</button>
      </div>
    `;
        openModal("Plane Upgrade", content);
    }
}

async function upgradePlanePart(part) {
    try {
        const data = await fetchJson("/api/upgrade-plane", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({player: player.name, part: part})
        });
        player.money = data.money;
        creditsEl.textContent = String(data.money);
        const content = `
      <div class="upgrade-menu">
        <div class="upgrade-header">
          <div>
            <p class="upgrade-title">Plane Upgrades</p>
            <p class="upgrade-balance">Balance: <strong>${formatMoney(data.money)}</strong></p>
          </div>
        </div>
        <div class="upgrade-grid">
          <div class="upgrade-card">
            <p class="upgrade-name">Hull</p>
            <p class="upgrade-level">Level ${data.levels.ruuma}/5</p>
            <button class="menu-btn upgrade-action" onclick="upgradePlanePart('ruuma')">Upgrade 1000€</button>
          </div>
          <div class="upgrade-card">
            <p class="upgrade-name">Seats</p>
            <p class="upgrade-level">Level ${data.levels.istuinpaikat}/5</p>
            <button class="menu-btn upgrade-action" onclick="upgradePlanePart('istuinpaikat')">Upgrade 1000€</button>
          </div>
          <div class="upgrade-card">
            <p class="upgrade-name">Engine</p>
            <p class="upgrade-level">Level ${data.levels.moottori}/5</p>
            <button class="menu-btn upgrade-action" onclick="upgradePlanePart('moottori')">Upgrade 1000€</button>
          </div>
        </div>
      </div>
    `;
        openModal("Plane Upgrade", content);
    } catch (error) {
        console.error("Error upgrading plane part:", error);
        const content = `
      <div class="upgrade-menu">
        <p class="menu-error">Failed to upgrade plane part.</p>
        <button class="menu-btn" onclick="closeModal()">Close</button>
      </div>
    `;
        openModal("Plane Upgrade", content);
    }
}

async function listNewBasesForSale() {
    try {
        const data = await fetchJson("/api/available-bases?player=" + encodeURIComponent(player.name));
        const bases = data.bases;
        const content = `
      <div class="base-sale-menu">
        <p class="menu-info">Available Bases for Purchase:</p>
        <ul class="modal-base-list">
          ${bases.map(base => `<li>${base.name} (${base.continent}) - ${formatMoney(base.price)} <button class="menu-btn" onclick="buyNewBase('${base.ident}'), closeModal()">Buy</button></li>`).join("")}
        </ul>
        <button class="menu-btn" onclick="closeModal()">Close</button>
      </div>
    `;
        openModal("Buy New Bases", content);
    } catch (error) {
        console.error("Error fetching available bases:", error);
        const content = `
      <div class="base-sale-menu">
        <p class="menu-error">Failed to load available bases.</p>
      </div>
    `;
        openModal("Buy New Bases", content);
    }
}

async function buyNewBase(baseIdent) {
  try {
    const data = await fetchJson("/api/buy-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player: player.name, baseIdent })
    });

    player.money = data.money;
    creditsEl.textContent = String(data.money); // ✅ ALWAYS update money

    if (data.gameWon) {
      openModal(
        "Game Won",
        `
        <div class="game-won-screen">
          <p class="menu-info">YOU BEAT THE SYSTEM</p>
          <p id="gamewontext"></p>
          <button class="menu-btn" onclick="closeModal()">Thank You</button>
        </div>
        `
      );

      const el = document.getElementById("gamewontext");
      if (el) {
        typewriterText(el, data.gameWonMessage, 40);
      }

      return;
    }

    // ✅ Normal purchase flow
    appendCaption(`Purchased new base: ${baseIdent}`);
    await loadBases();
    closeModal();

  } catch (error) {
    console.error("Error buying new base:", error);
    openModal(
      "Buy New Bases",
      `
      <div class="base-sale-menu">
        <p class="menu-error">Failed to purchase base.</p>
        <button class="menu-btn" onclick="closeModal()">Close</button>
      </div>
      `
    );
  }
}
``


// Make functions global for onclick handlers
window.upgradePlane = upgradePlane;
window.upgradePlanePart = upgradePlanePart;

// Main flight sequence: animates the plane through three legs:
//   1. Fly from player location to mission pickup airport
//   2. Hold at pickup while cargo is loaded
//   3. Fly from pickup to destination
// After landing, calls the backend and refreshes game state.

function startSelectedMission() {
    if (!player.selectedMission || isFlying) return;

    const selectedMission = player.selectedMission;
    stopFlightAnimation();
    showCaptainLog(selectedMission);
    appendCaption(`Mission accepted: ${selectedMission.Name}`);

    isFlying = true;
    flightStatusEl.textContent = `In flight to mission start: ${selectedMission.Location[0][0]}`;

    let durationMs = 22000;
    let startTime = performance.now();

    let isPaused = false;
    let pauseStartTime = 0;
    let totalPausedTime = 0;

    const legAStart = player.location
        ? {lat: player.location.lat, lon: player.location.lon}
        : {lat: selectedMission.Location[0][2], lon: selectedMission.Location[0][3]};

    const legAEnd = {lat: selectedMission.Location[0][2], lon: selectedMission.Location[0][3]};
    const legBStart = {lat: selectedMission.Location[0][2], lon: selectedMission.Location[0][3]};
    const legBEnd = {lat: selectedMission.Destination[0][2], lon: selectedMission.Destination[0][3]};

    const legAEndPct = 0.35;
    const holdEndPct = 0.58;
    const milestones = new Set();

    async function step(now) {
        if (isPaused) {
            animationFrameId = requestAnimationFrame(step);
            return;
        }

        const elapsed = now - startTime - totalPausedTime;
        const progress = Math.min(elapsed / durationMs, 1);

        if (progress < legAEndPct) {
            setPlanePosition(legAStart, legAEnd, progress / legAEndPct);

            if (progress > 0.2 && !milestones.has("event-a")) {
                milestones.add("event-a");
                const x = Math.floor(Math.random() * 5);
                if (x == 2) {

                    isPaused = true;
                    pauseStartTime = performance.now();

                    await randomEvent("duringFlight", 0);

                    totalPausedTime += performance.now() - pauseStartTime;
                    isPaused = false;
                }
            }

        } else if (progress < holdEndPct) {
            setPlanePosition(legAEnd, legAEnd, 1);
            if (progress > 0.2 && !milestones.has("at-gate")) {
                appendCaption(`Ground crew started trying to load ${selectedMission.cargoAmount} ${selectedMission.cargo.includes("humans") ? "passengers" : "cargo units"}.`);
                milestones.add("at-gate");
                const x = Math.floor(Math.random() * 5);
                console.log(x);
                if (x == 2) {

                    isPaused = true;
                    pauseStartTime = performance.now();

                    await randomEvent("airport", 0);

                    totalPausedTime += performance.now() - pauseStartTime;
                    isPaused = false;
                }
            }
        } else {
            setPlanePosition(
                legBStart,
                legBEnd,
                (progress - holdEndPct) / (1 - holdEndPct)
            );
            if (progress > 0.1 && !milestones.has("cargo-loaded")) {
                appendCaption(`Departed to ${selectedMission.Destination[0][0]} ${selectedMission.Destination[0][1]}`)
                milestones.add("cargo-loaded");
            }
        }

        flightProgressEl.style.width = `${Math.floor(progress * 100)}%`;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(step);
            return;
        }

        stopFlightAnimation();
        const result = await completeMissionOnBackend(selectedMission);

        const flownAmount = result.flownCargoAmount;
        const isPeople = result.cargoType.includes("Humans");
        const unit = isPeople ? "passengers" : "cargo units";

        appendCaption(`co2 consumed ${result.co2_consumed} kg`);
        appendCaption(`co2 limit gained back ${result.plantGrowth} kg because of plant growth in your base`);

        if (flownAmount < selectedMission.cargoAmount) {
            appendCaption(
                `${flownAmount} ${unit} transported (capacity limited by aircraft)`
            )
        } else {
            appendCaption(
                `${flownAmount} ${unit} transported`
            )
        }
        appendCaption(
            `Mission completed: ${selectedMission.Name} — Payment received: ${formatMoney(result.payout)}`
        );

        await loadGameState();
        await loadMissions();

        renderButton("Select New Mission", showMissionSelection);
        refreshMapSize();
    }

    animationFrameId = requestAnimationFrame(step);
}

async function randomEvent(type, id) {
    if (id == 1) return;
    if (id == 67) {
        endGame();
        return;
    }

    try {
        const data = await fetchJson(`/api/randomEvent?type=${type}&id=${id}`);
        appendCaption(data.event.text);
        clearButtons();

        return new Promise((resolve) => {
            for (const btn of data.event.buttons) {
                renderButton(btn.label, async () => {
                    clearButtons();
                    if (btn.id) {
                        await randomEvent(type, btn.id);
                    }

                    resolve();
                });
            }
        });

    } catch (error) {
        console.log(error.message);
    }
}

// ============================================================
// SCREEN NAVIGATION
// Transitions between auth -> save select -> game screens.
// ============================================================

// Loads the selected save and transitions to the main game view
async function enterGameWithSelectedSave() {
    if (!selectedSaveName) {
        return;
    }

    player = new Player(selectedSaveName);
    playerNameEl.textContent = player.name;

    await loadBases();
    await loadGameState();
    await loadMissions();
    flightStatusEl.textContent = "Connected to backend";

    saveOverlayEl.classList.add("hidden");
    authOverlayEl.classList.add("hidden");
    document.body.classList.add("game-mode");
    gameAppEl.classList.remove("app-hidden");
    refreshMapSize();
}

// Returns from the game view back to the save selection screen
async function goBackToSaves() {
    stopFlightAnimation();
    player = null;
    gameAppEl.classList.add("app-hidden");
    authOverlayEl.classList.add("hidden");
    document.body.classList.remove("game-mode");
    saveOverlayEl.classList.remove("hidden");
    await loadSaves();
}

// ============================================================
// EVENT LISTENERS
// Wires up all buttons and forms to their handler functions.
// ============================================================

// DB login form – authenticates against MariaDB via the backend
dbLoginFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    dbAuthStatusEl.textContent = "Connecting to MariaDB...";

    try {
        const data = await fetchJson("/api/db-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                host: dbHostEl.value.trim(),
                port: Number.parseInt(dbPortEl.value, 10),
                user: dbUserEl.value.trim(),
                password: dbPasswordEl.value,
                database: dbNameEl.value.trim()
            })
        });

        dbSessionToken = data.session;
        localStorage.setItem("flightgame-db-session", dbSessionToken);

        authOverlayEl.classList.add("hidden");
        saveOverlayEl.classList.remove("hidden");
        await loadSaves();
    } catch (error) {
        dbAuthStatusEl.textContent = "Login failed. Check MariaDB credentials.";
    }
});

refreshSavesBtnEl.addEventListener("click", async () => {
    try {
        await loadSaves();
    } catch (_error) {
        saveStatusEl.textContent = "Could not load saves";
    }
});

createSaveBtnEl.addEventListener("click", () => {
    createSave().catch((error) => {
        saveStatusEl.textContent = "Could not create save";
    });
});

deleteSaveBtnEl.addEventListener("click", () => {
    deleteSelectedSave().catch((error) => {
        saveStatusEl.textContent = "Could not delete save";
    });
});

continueBtnEl.addEventListener("click", async () => {
    if (continueBtnEl.disabled) return;
    continueBtnEl.disabled = true;
    try {
        saveStatusEl.textContent = "Loading pilot save...";
        await enterGameWithSelectedSave();
    } catch (_error) {
        console.log(_error.message);
        saveStatusEl.textContent = "Could not load selected save";
        continueBtnEl.disabled = false;
    }
});

// Start flight & back-to-saves buttons
backToSavesBtn.addEventListener("click", () => {
    goBackToSaves().catch(() => {
        saveStatusEl.textContent = "Could not return to saves";
    });
});


if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
        openMusicSettingsModal();
    });
}


// ============================================================
// BOOTSTRAP
// Entry point – decides which screen to show on page load.
// If a previous DB session token exists in localStorage, skips
// the login screen and goes straight to save selection.
// ============================================================
function bootstrap() {
    authOverlayEl.classList.remove("hidden");
    saveOverlayEl.classList.add("hidden");
    gameAppEl.classList.add("app-hidden");
    document.body.classList.remove("game-mode");

    const existingSession = localStorage.getItem("flightgame-db-session");
    if (existingSession) {
        dbSessionToken = existingSession;
        authOverlayEl.classList.add("hidden");
        saveOverlayEl.classList.remove("hidden");
        loadSaves().catch(() => {
            dbSessionToken = "";
            localStorage.removeItem("flightgame-db-session");
            authOverlayEl.classList.remove("hidden");
            saveOverlayEl.classList.add("hidden");
            dbAuthStatusEl.textContent = "Previous DB session expired. Please login again.";

        });
    }
    document.addEventListener(
        "click",
        () => {
            if (backgroundMusic.paused) {
                backgroundMusic.play().catch(() => {
                });
            }
        },
        {once: true}
    );
}

document.addEventListener("DOMContentLoaded", bootstrap);
