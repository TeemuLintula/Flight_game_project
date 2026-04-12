let missions = [];
let playerName = "";
let dbSessionToken = "";
let selectedSaveName = "";

const authOverlayEl = document.getElementById("authOverlay");
const saveOverlayEl = document.getElementById("saveOverlay");
const gameAppEl = document.getElementById("gameApp");
const dbAuthStatusEl = document.getElementById("dbAuthStatus");
const saveStatusEl = document.getElementById("saveStatus");

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

const map = L.map("map", {
  zoomControl: false
}).setView([50.8, 12.5], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

L.control.zoom({ position: "bottomright" }).addTo(map);

let activeRoute = null;
let preRoute = null;
let fromMarker = null;
let toMarker = null;
let planeMarker = null;
let playerMarker = null;
let playerLocation = null;
let selectedMission = null;
let animationFrameId = null;
let isFlying = false;

function hasValidCoords(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function formatMoney(n) {
  return `${n.toLocaleString("en-US")} E`;
}

function missionTotal(m) {
  return m.cargoAmount * m.payRate;
}

function refreshMapSize() {
  requestAnimationFrame(() => map.invalidateSize());
  setTimeout(() => map.invalidateSize(), 120);
  setTimeout(() => map.invalidateSize(), 320);
}

function appendCaption(text) {
  const line = document.createElement("article");
  line.className = "caption-line";
  line.textContent = text;
  captionListEl.appendChild(line);
  captionListEl.scrollTop = captionListEl.scrollHeight;
}

function showCaptainLog(mission) {
  missionPanelTitleEl.textContent = "Captain Log";
  missionPanelSubtitleEl.textContent = `Live flight feed for ${mission.name}`;
  missionListEl.classList.add("hidden");
  captionListEl.classList.remove("hidden");
  captionListEl.innerHTML = "";
  refreshMapSize();
}

function showMissionSelection() {
  missionPanelTitleEl.textContent = "Available Missions";
  missionPanelSubtitleEl.textContent = "Tap a mission to preview route and payout.";
  captionListEl.classList.add("hidden");
  missionListEl.classList.remove("hidden");
  refreshMapSize();
}

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

function stopFlightAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  isFlying = false;
  startMissionBtn.disabled = false;
}

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

async function loadSaves() {
  saveStatusEl.textContent = "Loading saves...";
  const data = await fetchJson("/api/saves");
  renderSaveList(data.saves || []);
  saveStatusEl.textContent = "Select save to continue";
}

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

function createMissionCard(mission, index) {
  const card = document.createElement("article");
  card.className = `mission-card ${mission.legal ? "" : "illegal"}`;
  card.style.animationDelay = `${index * 80}ms`;

  const cargoUnit = mission.cargo.includes("humans") ? "passengers" : "units";
  card.innerHTML = `
    <h3 class="mission-title">${mission.name}</h3>
    <p class="mission-meta">${mission.from.country} -> ${mission.to.country}</p>
    <p class="mission-meta">Cargo: ${mission.cargoAmount} ${cargoUnit} (${mission.cargo})</p>
    <div class="meta-row">
      <span class="tag ${mission.legal ? "" : "illegal"}">${mission.legal ? "LEGAL" : "ILLEGAL"}</span>
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

async function loadMissions() {
  startMissionBtn.disabled = true;
  routeLabelEl.textContent = "Loading missions from backend...";
  try {
    const data = await fetchJson(`/api/missions?player=${encodeURIComponent(playerName)}&count=5`);
    missions = Array.isArray(data.missions) ? data.missions : [];

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

async function goBackToSaves() {
  stopFlightAnimation();
  gameAppEl.classList.add("app-hidden");
  authOverlayEl.classList.add("hidden");
  document.body.classList.remove("game-mode");
  saveOverlayEl.classList.remove("hidden");
  selectedMission = null;
  await loadSaves();
}

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

startMissionBtn.addEventListener("click", startSelectedMission);
backToSavesBtn.addEventListener("click", () => {
  goBackToSaves().catch(() => {
    saveStatusEl.textContent = "Could not return to saves";
  });
});

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
