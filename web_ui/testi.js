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

      if (progress > 0.98 && !milestones.has("arrived-pickup")) {
        appendCaption(`Arrived at ${selectedMission.Location[0][0]}`);
        flightStatusEl.textContent = `Arrived at ${selectedMission.Location[0][0]}`;
        milestones.add("arrived-pickup");
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

      if (progress > 0.98 && !milestones.has("cargo-loaded")) {
        appendCaption(`${selectedMission.cargoAmount} ${selectedMission.cargo.includes("humans") ? "passengers" : "cargo units"} loaded in`);
        appendCaption(`Departed to ${selectedMission.Destination[0][0]} ${selectedMission.Destination[0][1]}`)
        milestones.add("cargo-loaded");

      } else {
        setPlanePosition(
            legBStart,
            legBEnd,
            (progress - holdEndPct) / (1 - holdEndPct)
        );
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