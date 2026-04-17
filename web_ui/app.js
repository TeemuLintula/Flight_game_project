// ============================================================
// GLOBAL STATE
// Tracks current game session: loaded missions, active player,
// database session token, and selected save slot.
// ============================================================
let missions = [];
let playerName = "";
let dbSessionToken = "";
let selectedSaveName = "";

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
const missionPanelTitleEl = document.getElementById("missionPanelTitle");
const missionPanelSubtitleEl = document.getElementById("missionPanelSubtitle");
const routeLabelEl = document.getElementById("routeLabel");
const startMissionBtn = document.getElementById("startMissionBtn");
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

L.control.zoom({ position: "bottomright" }).addTo(map);

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
let playerLocation = null;// { lat, lon, airport, country }
let selectedMission = null;
let animationFrameId = null;
let isFlying = false;

// ============================================================
// UTILITY HELPERS
// ============================================================

// Returns true when both lat and lon are real finite numbers
function hasValidCoords(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon);
}

// Formats a number as in-game currency, e.g. "1,200 E"
function formatMoney(n) {
  return `${n.toLocaleString("en-US")} E`;
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

// ============================================================
// UI PANEL TOGGLING
// Switches the left panel between mission list and captain log.
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
  missionPanelSubtitleEl.textContent = `Live flight feed for ${mission.name}`;
  missionListEl.classList.add("hidden");
  captionListEl.classList.remove("hidden");
  captionListEl.innerHTML = "";
  refreshMapSize();
}

// Switches panel back to the mission selection list
function showMissionSelection() {
  missionPanelTitleEl.textContent = "Available Missions";
  missionPanelSubtitleEl.textContent = "Tap a mission to preview route and payout.";
  captionListEl.classList.add("hidden");
  missionListEl.classList.remove("hidden");
  refreshMapSize();
}

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
  if (!playerLocation || !hasValidCoords(playerLocation.lat, playerLocation.lon)) {
    return;
  }

  const point = [playerLocation.lat, playerLocation.lon];
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
  playerMarker.bindPopup(`You are here: ${playerLocation.airport}, ${playerLocation.country}`);
}

// Draws the full route for a mission: player -> pickup -> destination
function drawMission(mission) {
  selectedMission = mission;
  clearMapObjects();

  drawPlayerLocationMarker();

  const origin = playerLocation && hasValidCoords(playerLocation.lat, playerLocation.lon)
    ? [playerLocation.lat, playerLocation.lon]
    : [mission.from.lat, mission.from.lon];

  const from = [mission.from.lat, mission.from.lon];
  const to = [mission.to.lat, mission.to.lon];

  fromMarker = L.marker(from, {
    icon: L.divIcon({
      className: "",
      html: '<div class="start-marker"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    })
  }).addTo(map).bindPopup(`Start: ${mission.from.airport}, ${mission.from.country}`);

  toMarker = L.marker(to, {
    icon: L.divIcon({
      className: "",
      html: '<div class="dest-marker"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    })
  }).addTo(map).bindPopup(`Destination: ${mission.to.airport}, ${mission.to.country}`);

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
  map.fitBounds(bounds, { padding: [40, 40] });
  routeLabelEl.textContent = `${mission.name}: Your Location -> ${mission.from.airport} -> ${mission.to.airport}`;
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
  startMissionBtn.disabled = false;
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
  const data = await fetchJson(`/api/game-state?player=${encodeURIComponent(playerName)}`);
  creditsEl.textContent = String(data.money);
  co2BudgetEl.textContent = String(data.co2_remaining);

  const lat = Number(data.location_lat);
  const lon = Number(data.location_lon);
  playerLocation = {
    lat,
    lon,
    airport: data.location_airport,
    country: data.location_country
  };

  if (hasValidCoords(lat, lon)) {
    drawPlayerLocationMarker();
  }
}

// ============================================================
// MISSION LIST RENDERING
// Builds and displays the clickable mission cards.
// ============================================================

// Creates a single mission card DOM element
function createMissionCard(mission, index) {
  const card = document.createElement("article");
  card.className = `mission-card ${mission.legal ? "" : "risky"}`;
  card.style.animationDelay = `${index * 80}ms`;

  const cargoUnit = mission.cargo.includes("humans") ? "passengers" : "units";
  card.innerHTML = `
    <h3 class="mission-title">${mission.name}</h3>
    <p class="mission-meta">${mission.from.country} -> ${mission.to.country}</p>
    <p class="mission-meta">Cargo: ${mission.cargoAmount} ${cargoUnit} (${mission.cargo})</p>
    <div class="meta-row">
      <span class="tag ${mission.legal ? "" : "risky"}">${mission.legal ? "NO RISK" : "RISKY"}</span>
      <span class="pay">${formatMoney(missionTotal(mission))}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    stopFlightAnimation();
    document.querySelectorAll(".mission-card").forEach((el) => el.classList.remove("active"));
    card.classList.add("active");
    drawMission(mission);
  });

  return card;
}

// Renders the full mission list and auto-selects the first one
function renderMissionList() {
  showMissionSelection();
  missionListEl.innerHTML = "";
  missions.forEach((mission, idx) => {
    missionListEl.appendChild(createMissionCard(mission, idx));
  });

  const firstCard = missionListEl.querySelector(".mission-card");
  if (firstCard && missions.length > 0) {
    firstCard.classList.add("active");
    drawMission(missions[0]);
  }
}

// Fetches missions from backend for the current player
async function loadMissions() {
  startMissionBtn.disabled = true;
  routeLabelEl.textContent = "Loading missions from backend...";
  try {
    const data = await fetchJson(`/api/callMissions?player=${encodeURIComponent(playerName)}&count=5`);
    missions = Array.isArray(data.missions) ? data.missions : [];
    console.log(missions);
    if (missions.length === 0) {
      missionListEl.innerHTML = "<p class='mission-meta'>No missions available right now.</p>";
      routeLabelEl.textContent = "No route available";
      flightStatusEl.textContent = "Idle";
      startMissionBtn.disabled = true;
      return;
    }

    renderMissionList();
    startMissionBtn.disabled = false;
  } catch (error) {
    missionListEl.innerHTML = "<p class='mission-meta'>Could not load missions. Try refresh.</p>";
    routeLabelEl.textContent = "Mission load failed";
    flightStatusEl.textContent = "Mission service unavailable";
    startMissionBtn.disabled = false;
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
    body: JSON.stringify({ pilot })
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
    body: JSON.stringify({ pilot: selectedSaveName })
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
      player: playerName,
      mission
    })
  });
}

// Main flight sequence: animates the plane through three legs:
//   1. Fly from player location to mission pickup airport
//   2. Hold at pickup while cargo is loaded
//   3. Fly from pickup to destination
// After landing, calls the backend and refreshes game state.
function startSelectedMission() {
  if (!selectedMission || isFlying) {
    return;
  }

  stopFlightAnimation();
  showCaptainLog(selectedMission);
  appendCaption(`Mission accepted: ${selectedMission.name}`);
  appendCaption(`Routing to pickup airport ${selectedMission.from.airport}.`);

  isFlying = true;
  startMissionBtn.disabled = true;
  flightStatusEl.textContent = `In flight to mission start: ${selectedMission.from.airport}`;

  const durationMs = 22000;
  const startTime = performance.now();

  const legAStart = playerLocation
    ? { lat: playerLocation.lat, lon: playerLocation.lon }
    : { lat: selectedMission.from.lat, lon: selectedMission.from.lon };
  const legAEnd = { lat: selectedMission.from.lat, lon: selectedMission.from.lon };
  const legBStart = { lat: selectedMission.from.lat, lon: selectedMission.from.lon };
  const legBEnd = { lat: selectedMission.to.lat, lon: selectedMission.to.lon };
  const legAEndPct = 0.35;
  const holdEndPct = 0.58;
  const milestones = new Set();
  const airEvents = [
    "Weather update: mild crosswinds, autopilot stable.",
    "Cabin check complete. Cargo restraints look good.",
    "ATC confirms corridor is clear ahead.",
    "Engine report: performance nominal."
  ];

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);

    if (progress < legAEndPct) {
      setPlanePosition(legAStart, legAEnd, progress / legAEndPct);
      flightStatusEl.textContent = `Flying to mission start: ${selectedMission.from.airport}`;
      if (!milestones.has("depart")) {
        appendCaption(`Departed from ${playerLocation?.airport || "current position"}.`);
        milestones.add("depart");
      }
      if (progress > 0.2 && !milestones.has("event-a")) {
        appendCaption(airEvents[Math.floor(Math.random() * airEvents.length)]);
        milestones.add("event-a");
      }
    } else if (progress < holdEndPct) {
      setPlanePosition(legAEnd, legAEnd, 1);
      const loadProgress = (progress - legAEndPct) / (holdEndPct - legAEndPct);
      const remainingSec = Math.max(0, Math.ceil((1 - loadProgress) * 8));
      flightStatusEl.textContent = `Loading at ${selectedMission.from.airport} (${remainingSec}s)`;

      if (!milestones.has("pickup")) {
        appendCaption(`Reached pickup airport ${selectedMission.from.airport}.`);
        appendCaption(`Ground crew started loading ${selectedMission.cargoAmount} ${selectedMission.cargo.includes("humans") ? "passengers" : "cargo units"}.`);
        milestones.add("pickup");
      }
      if (loadProgress > 0.5 && !milestones.has("event-load")) {
        appendCaption("Loading complete. Final checks in progress.");
        milestones.add("event-load");
      }
      if (loadProgress > 0.92 && !milestones.has("pushback")) {
        appendCaption(`Pushback approved. Taxiing for departure to ${selectedMission.to.airport}.`);
        milestones.add("pushback");
      }
    } else {
      setPlanePosition(legBStart, legBEnd, (progress - holdEndPct) / (1 - holdEndPct));
      flightStatusEl.textContent = `Flying mission route: ${selectedMission.from.airport} -> ${selectedMission.to.airport}`;
      if (progress > 0.7 && !milestones.has("event-b")) {
        appendCaption(airEvents[Math.floor(Math.random() * airEvents.length)]);
        milestones.add("event-b");
      }
    }

    flightProgressEl.style.width = `${Math.floor(progress * 100)}%`;

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step);
      return;
    }

    stopFlightAnimation();
    completeMissionOnBackend(selectedMission)
      .then(async (result) => {
        playerLocation = {
          lat: selectedMission.to.lat,
          lon: selectedMission.to.lon,
          airport: selectedMission.to.airport,
          country: selectedMission.to.country
        };
        drawPlayerLocationMarker();
        creditsEl.textContent = String(result.money);
        co2BudgetEl.textContent = String(result.co2_remaining);
        flightStatusEl.textContent = `Mission complete: ${selectedMission.name} (+${formatMoney(result.payout)})`;
        appendCaption(`Landed at ${selectedMission.to.airport}. Mission complete.`);
        appendCaption(`Payout received: ${formatMoney(result.payout)}.`);
        await loadGameState();
        await loadMissions();
      })
      .catch(() => {
        flightStatusEl.textContent = "Flight complete, but backend update failed";
        appendCaption("Flight ended, but backend update failed. Retry refreshing missions.");
      });
  };

  animationFrameId = requestAnimationFrame(step);
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

  playerName = selectedSaveName;
  playerNameEl.textContent = playerName;

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
  gameAppEl.classList.add("app-hidden");
  authOverlayEl.classList.add("hidden");
  document.body.classList.remove("game-mode");
  saveOverlayEl.classList.remove("hidden");
  selectedMission = null;
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
  try {
    saveStatusEl.textContent = "Loading pilot save...";
    await enterGameWithSelectedSave();
  } catch (_error) {
    saveStatusEl.textContent = "Could not load selected save";
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

bootstrap();
