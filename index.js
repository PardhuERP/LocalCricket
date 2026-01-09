const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let actionInProgress = false;
let popupMode = null;
let popupActive = false;
let lastHandledEventKey = null;

// ✅ EVENT LOCKS
let lastWicketCount = null;
let lastOverForBowlerPopup = null;
let wicketOverStep = null; // null | "BATSMAN_DONE"

function el(id) {
  return document.getElementById(id);
}

/* =========================
   LOAD LIVE SCORE
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
   STATE CONTROLLER (FINAL)
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  const eventKey = `${d.over}-${d.ball}-${d.wickets}-${d.state}`;

  // ⛔ prevent handling same event twice
  if (eventKey === lastHandledEventKey) return;

  // 🟡 normal wicket
  if (d.state === "WICKET") {
    lastHandledEventKey = eventKey;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟡 6th ball wicket (first batsman popup)
  if (d.state === "WICKET_OVER_END") {
    lastHandledEventKey = eventKey;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟢 over end (after batsman is set)
  if (d.state === "OVER_END") {
    lastHandledEventKey = eventKey;
    openPopup("BOWLER", "Select New Bowler");
    return;
  }

  // 🔄 normal play resumed
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
  console.log("New batsman:", v);

  callAction(
    `${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`,
    true
  );

  closePopup();
  return;
}

  // 🟢 BOWLER
  if (popupMode === "BOWLER") {
    callAction(
      `${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`,
      true
    );
    closePopup();
  }
}

/* =========================
   API CALL HANDLER
========================= */
function callAction(url, force = false) {
  if (actionInProgress && !force) return;

  actionInProgress = true;
  fetch(url)
    .then(() => loadLiveScore())
    .finally(() => {
      setTimeout(() => (actionInProgress = false), 300);
    });
}

/* =========================
   BUTTON ACTIONS
========================= */
function addRun(r) {
  callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`);
}
function addExtra(t) {
  callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`);
}
function addWicket() {
  callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`);
}
function undoBall() {
  console.log("UNDO CLICKED");

  // 🔴 FULL UI RESET (VERY IMPORTANT)
  popupActive = false;
  popupMode = null;
  lastHandledEventKey = null;

  closePopup();

  // 🚨 force undo API
  fetch(`${API}?action=undoBall&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(res => {
      console.log("Undo response:", res);

      // ⏳ slight delay so backend settle avutundi
      setTimeout(loadLiveScore, 200);
    })
    .catch(err => console.error("Undo error:", err))
    .finally(() => {
      actionInProgress = false;
    });
}

/* =========================
   INIT
========================= */
window.onload = () => {
  loadLiveScore();
  setInterval(loadLiveScore, 2000);
};
