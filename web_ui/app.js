// ============================================================
// GLOBAL STATE
// Tracks current game session: loaded missions, active player,
// database session token, and selected save slot.
// ============================================================
let dbSessionToken = "";
let selectedSaveName = "";
let player = null;  // Instance of Player class

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

// ============================================================
// UI PANEL TOGGLING
// Switches the left panel between mission list, captain log, and base selection.
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
// captionListEl.innerHTML = "";
    refreshMapSize();
    clearButtons();
}

function showMissionContract(mission) {
    missionPanelTitleEl.textContent = "";
    missionPanelSubtitleEl.textContent = "";
    captionListEl.classList.remove("hidden");
    missionListEl.classList.add("hidden");
    baseListEl.classList.add("hidden");
    missionBasetglEl.classList.add("hidden");
    baseActionsEl.classList.add("hidden");


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

// Switches panel back to the mission selection list
function showMissionSelection() {
    missionPanelTitleEl.textContent = "Available Missions";
    missionPanelSubtitleEl.textContent = "Tap a mission to preview route and payout.";
    captionListEl.classList.add("hidden");
    missionListEl.classList.remove("hidden");
    baseListEl.classList.add("hidden");
    baseActionsEl.classList.add("hidden");
    missionBasetglEl.classList.remove("hidden");
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
    baseActionsEl.classList.add("hidden");
    loadBases();
    refreshMapSize();
    clearButtons();
}

function showbaseActions(base = null) {
    const selectedBase = base || player.selectedBase;
    if (!selectedBase) return;

    missionPanelTitleEl.textContent = `Home Base: ${selectedBase.airport}`;
    missionPanelSubtitleEl.textContent = "Manage your base and plane";
    baseActionsEl.classList.remove("hidden");
    captionListEl.classList.add("hidden");
    missionListEl.classList.add("hidden");
    baseListEl.classList.add("hidden");
    missionBasetglEl.classList.add("hidden");
    baseActionsEl.innerHTML = "";

    const btn = document.createElement("button");
    btn.className = "mission-btn";
    btn.textContent = "Check Plants";
    btn.addEventListener("click", () => checkPlants(selectedBase.ident));
    baseActionsEl.appendChild(btn);

    const backBtn = document.createElement("button");
    backBtn.className = "mission-btn";
    backBtn.textContent = "Back to Missions";
    backBtn.addEventListener("click", showMissionSelection);
    baseActionsEl.appendChild(backBtn);
}

function toggleBaseSelection() {
    missionBasetglEl.classList.toggle("active");
    if (missionBasetglEl.classList.contains("active")) {
        missionBasetglEl.textContent = "Show Missions";
        showBaseselection();
    } else if (missionBasetglEl.classList.contains("active") == false) {
        missionBasetglEl.textContent = "Select Bases";
        showMissionSelection();
    } else {
        missionBasetglEl.textContent = "Back to base";
        showbaseActions();
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
                html: '<div class="player-marker">✈️</div>',
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
                html: '<div class="plane-marker">JET</div>',
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
     <p>Credits: ${formatMoney(save.money)}</p>
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
    await fetchJson("/api/create-save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({pilot})
    });

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

    await fetchJson("/api/delete-save", {
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

    async function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / totalDurationMs, 1);

        setPlanePosition(startPoint, basePoint, progress);
        flightProgressEl.style.width = `${Math.floor(progress * 100)}%`;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(step);
            return;
        }

        stopFlightAnimation();
        appendCaption(`Landed at home base: ${base.airport}`);
        await completeHomebaseOnBackend(base);
        await loadGameState();
        isFlying = false;
        flightStatusEl.textContent = `Arrived at home base: ${base.airport}`;
        showbaseActions();
    }

    animationFrameId = requestAnimationFrame(step);
}

//=============================================================
// Base action functions
//=============================================================

async function checkPlants(baseIdent) {
    try {
        const data = await fetchJson(`/api/check-plants?base=${baseIdent}&player=${encodeURIComponent(player.name)}`);
        const plantStatusEL = document.createElement("p");
        plantStatusEL.textContent = `Plant status: ${data.plants}`;
        baseActionsEl.appendChild(plantStatusEL);
    } catch (error) {
        console.error("Error checking plants:", error);
        const errorEl = document.createElement("p");
        errorEl.textContent = "Failed to check plants.";
        baseActionsEl.appendChild(errorEl);
    }
}

async function upgradePlane() {
    try {
        const data = await fetchJson("/api/upgrade-plane", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({player: player.name})
        });
        appendCaption(`Plane upgraded: ${data.message}`);
        showCaptainLog({Name: "Base Management"});
    } catch (error) {
        console.error("Error upgrading plane:", error);
        appendCaption("Failed to upgrade plane.");
    }
}

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
                //RANDOM EVENTTI TÄSSÄ
                if (true) {

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
                appendCaption(`Ground crew started loading ${selectedMission.cargoAmount} ${selectedMission.cargo.includes("humans") ? "passengers" : "cargo units"}.`);
                milestones.add("at-gate");
                //RANDOM EVENTTI TÄSSÄ
                if (true) {

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
              appendCaption(`${selectedMission.cargoAmount} ${selectedMission.cargo.includes("humans") ? "passengers" : "cargo units"} loaded in`);
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
            completeMissionOnBackend(selectedMission);
            await loadGameState();
        }

        animationFrameId = requestAnimationFrame(step);
    }

    async function randomEvent(type, id) {
        if (id == 1) return;

        try {
            const data = await fetchJson(`/api/randomEvent?type=${type}&id=${id}`);
            appendCaption(data.event.text);
            clearButtons();

            return new Promise((resolve) => {
                for (const btn of data.event.buttons) {
                    renderButton(btn.label, async () => {
                        clearButtons();

// Continue chain OR resolve if end
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

    refreshMissionsBtn.addEventListener("click", async () => {
        try {
            await loadMissions();
            flightStatusEl.textContent = "Mission board updated";
        } catch (_error) {
            flightStatusEl.textContent = "Could not refresh missions";
        }
    });

// Start flight & back-to-saves buttons
    backToSavesBtn.addEventListener("click", () => {
        goBackToSaves().catch(() => {
            saveStatusEl.textContent = "Could not return to saves";
        });
    });

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
    }

    document.addEventListener("DOMContentLoaded", bootstrap);