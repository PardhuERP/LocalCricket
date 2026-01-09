const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let actionInProgress = false;
let popupMode = null;
let popupActive = false;

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

  /* 🟡 EVERY WICKET */
  if (d.state === "WICKET" && d.wickets !== lastWicketCount) {
    lastWicketCount = d.wickets;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  /* 🟡 6th BALL WICKET (2 STEPS) */
  if (d.state === "WICKET_OVER_END") {

    // Step 1: batsman
    if (wicketOverStep === null) {
      lastWicketCount = d.wickets;
      wicketOverStep = "BATSMAN_DONE_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }

    // Step 2: bowler
    if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = null;
      lastOverForBowlerPopup = d.over;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  /* 🟢 NORMAL OVER END (BALL RESET TO 0) */
  if (
    d.ball === 0 &&
    d.over !== lastOverForBowlerPopup &&
    d.state !== "WICKET_OVER_END"
  ) {
    lastOverForBowlerPopup = d.over;
    openPopup("BOWLER", "Select New Bowler");
    return;
  }

  /* 🟢 RESET */
  if (d.state === "NORMAL") {
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

    if (el("state").innerText === "WICKET_OVER_END") {
      wicketOverStep = "BATSMAN_DONE";
    }

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
  popupActive = false;
  popupMode = null;
  wicketOverStep = null;
  closePopup();
  callAction(`${API}?action=undoBall&matchId=${MATCH_ID}`, true);
}

/* =========================
   INIT
========================= */
window.onload = () => {
  loadLiveScore();
  setInterval(loadLiveScore, 2000);
};
