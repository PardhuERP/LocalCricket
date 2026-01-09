const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

// prevent double click
let actionInProgress = false;

let popupMode = null; // "BATSMAN" or "BOWLER"

/* =========================
   SAFE DOM HELPER
========================= */
function el(id) {
  const e = document.getElementById(id);
  if (!e) {
    console.warn("Element not found:", id);
    return null;
  }
  return e;
}

/* =========================
   LOAD LIVE SCORE
========================= */
function loadLiveScore() {
  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(res => res.json())
    .then(data => {

      if (data.status !== "ok") {
        if (el("state")) el("state").innerText = "WAITING...";
        return;
      }

      if (el("score")) {
        el("score").innerText = `${data.totalRuns} / ${data.wickets}`;
      }

      if (el("overs")) {
        el("overs").innerText = `Overs: ${data.over}.${data.ball}`;
      }

      if (el("striker")) {
        el("striker").innerText = data.strikerId || "-";
      }

      if (el("nonStriker")) {
        el("nonStriker").innerText = data.nonStrikerId || "-";
      }

      if (el("bowler")) {
        el("bowler").innerText = data.bowlerId || "-";
      }

      if (el("state")) {
        el("state").innerText = data.state || "NORMAL";
      }
    })
    .catch(err => {
      console.error("loadLiveScore error:", err);
    });
}

handleStateUI(data.state);

/* =========================
   API CALL HANDLER
========================= */
function callAction(url, force = false) {
  if (actionInProgress && !force) {
    console.warn("Action blocked: previous action in progress");
    return;
  }

  actionInProgress = true;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log("Action response:", data);
      loadLiveScore();
    })
    .catch(err => {
      console.error("Action error:", err);
    })
    .finally(() => {
      setTimeout(() => {
        actionInProgress = false;
      }, 400);
    });
}
function handleStateUI(state) {
  if (state === "WICKET") {
    openPopup("BATSMAN", "Select New Batsman");
  }
  else if (state === "OVER_END") {
    openPopup("BOWLER", "Select New Bowler");
  }
  else if (state === "WICKET_OVER_END") {
    openPopup("BATSMAN", "Select New Batsman");
  }
  else {
    closePopup();
  }
}

function openPopup(mode, title) {
  popupMode = mode;
  el("popupTitle").innerText = title;

  // TEMP demo options (replace with real players later)
  const select = el("popupSelect");
  select.innerHTML = `
    <option value="">-- Select --</option>
    <option value="PLAYER_1">PLAYER_1</option>
    <option value="PLAYER_2">PLAYER_2</option>
    <option value="PLAYER_3">PLAYER_3</option>
  `;

  el("popup").classList.remove("hidden");
}

function closePopup() {
  popupMode = null;
  el("popup").classList.add("hidden");
}

function confirmPopup() {
  const selected = el("popupSelect").value;
  if (!selected) return alert("Select player");

  if (popupMode === "BATSMAN") {
    // future: API to set new batsman
    closePopup();
    return;
  }

  if (popupMode === "BOWLER") {
    callAction(
      `${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${selected}`,
      true
    );
    closePopup();
  }
         }



/* =========================
   BUTTON ACTIONS
========================= */
function addRun(runs) {
  callAction(
    `${API}?action=addRun&matchId=${MATCH_ID}&runs=${runs}`
  );
}

function addExtra(type) {
  callAction(
    `${API}?action=addExtra&matchId=${MATCH_ID}&type=${type}`
  );
}

function addWicket() {
  callAction(
    `${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`
  );
}

function undoBall() {
  callAction(
    `${API}?action=undoBall&matchId=${MATCH_ID}`,
    true // force undo
  );
}

/* =========================
   INIT AFTER PAGE LOAD
========================= */
window.onload = function () {
  console.log("Page loaded, starting live score");

  // ✅ PLACEHOLDERS (NEWLY ADDED – DO NOT REMOVE)
  if (el("score")) el("score").innerText = "-- / --";
  if (el("overs")) el("overs").innerText = "Overs: --.-";
  if (el("striker")) el("striker").innerText = "-";
  if (el("nonStriker")) el("nonStriker").innerText = "-";
  if (el("bowler")) el("bowler").innerText = "-";
  if (el("state")) el("state").innerText = "WAITING...";

  loadLiveScore();

  setInterval(function () {
    loadLiveScore();
  }, 2000);
};
