const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let actionInProgress = false;
let popupMode = null;
let popupActive = false;
let lastHandledEventKey = null;

/* =========================
   HELPERS
========================= */
function el(id) {
  return document.getElementById(id);
}

function postAction(payload) {
  return fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

/* =========================
   LOAD LIVE SCORE (GET ONLY)
========================= */
function loadLiveScore() {
  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") {
        el("state").innerText = "WAITING...";
        return;
      }

      el("score").innerText = `${d.totalRuns} / ${d.wickets}`;
      el("overs").innerText = `Overs: ${d.over}.${d.ball}`;
      el("striker").innerText = d.strikerId;
      el("nonStriker").innerText = d.nonStrikerId;
      el("bowler").innerText = d.bowlerId;
      el("state").innerText = d.state;

      handleStateUI(d);
    })
    .catch(err => console.error("Live score error:", err));
}

/* =========================
   STATE CONTROLLER
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  const eventKey = `${d.over}-${d.ball}-${d.wickets}-${d.state}`;
  if (eventKey === lastHandledEventKey) return;

  // 🟡 WICKET
  if (d.state === "WICKET") {
    lastHandledEventKey = eventKey;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟡 6th BALL WICKET
  if (d.state === "WICKET_OVER_END") {
    lastHandledEventKey = eventKey;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟢 OVER END (after batsman set)
  if (d.state === "OVER_END") {
    lastHandledEventKey = eventKey;
    openPopup("BOWLER", "Select New Bowler");
    return;
  }

  // 🔄 NORMAL
  if (d.state === "NORMAL") {
    lastHandledEventKey = null;
    closePopup();
  }
}

/* =========================
   POPUP CONTROL
========================= */
function openPopup(mode, title) {
  popupMode = mode;
  popupActive = true;

  el("popupTitle").innerText = title;
  el("popupSelect").innerHTML = `
    <option value="">-- Select --</option>
    <option value="PLAYER_1">PLAYER_1</option>
    <option value="PLAYER_2">PLAYER_2</option>
    <option value="PLAYER_3">PLAYER_3</option>
  `;

  el("popup").classList.remove("hidden");
}

function closePopup() {
  popupMode = null;
  popupActive = false;
  el("popup").classList.add("hidden");
}

/* =========================
   POPUP CONFIRM
========================= */
function confirmPopup() {
  const v = el("popupSelect").value;
  if (!v) return alert("Please select player");

  // 🟡 BATSMAN
  if (popupMode === "BATSMAN") {
    postAction({
      action: "setNewBatsman",
      matchId: MATCH_ID,
      newBatsmanId: v
    }).then(loadLiveScore);

    closePopup();
    return;
  }

  // 🟢 BOWLER
  if (popupMode === "BOWLER") {
    postAction({
      action: "changeBowler",
      matchId: MATCH_ID,
      newBowlerId: v
    }).then(loadLiveScore);

    closePopup();
  }
}

/* =========================
   BUTTON ACTIONS (POST ONLY)
========================= */
function addRun(r) {
  postAction({
    action: "addRun",
    matchId: MATCH_ID,
    runs: r
  }).then(loadLiveScore);
}

function addExtra(t) {
  postAction({
    action: "addExtra",
    matchId: MATCH_ID,
    type: t
  }).then(loadLiveScore);
}

function addWicket() {
  postAction({
    action: "addWicket",
    matchId: MATCH_ID,
    wicketType: "BOWLED"
  }).then(loadLiveScore);
}

function undoBall() {
  console.log("UNDO CLICKED");

  // 🔴 FULL UI RESET
  popupActive = false;
  popupMode = null;
  lastHandledEventKey = null;
  closePopup();

  postAction({
    action: "undoBall",
    matchId: MATCH_ID
  })
  .then(res => {
    console.log("Undo response:", res);
    setTimeout(loadLiveScore, 200);
  })
  .catch(err => console.error("Undo error:", err));
}

/* =========================
   INIT
========================= */
window.onload = () => {
  loadLiveScore();
  setInterval(loadLiveScore, 2000);
};
