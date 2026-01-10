const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupMode = null;
let popupActive = false;

let lastWicketCount = null;
let lastOverForBowlerPopup = null;
let wicketOverStep = null; // null | "BATSMAN_DONE_PENDING" | "BATSMAN_DONE"

// batsman id holders (VERY IMPORTANT)
window.currentStrikerId = null;
window.currentNonStrikerId = null;

/* =========================
   DOM HELPER
========================= */
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

      // score
      el("score").innerText = `${d.totalRuns} / ${d.wickets}`;
      el("overs").innerText = `Overs: ${d.over}.${d.ball}`;
      el("bowler").innerText = d.bowlerId;
      el("state").innerText = d.state;

      // store batsman IDs FIRST
      window.currentStrikerId = d.strikerId;
      window.currentNonStrikerId = d.nonStrikerId;

      // show batsman stats
      loadBatsmanStats();

      // popup controller
      handleStateUI(d);
    })
    .catch(err => console.error("Live score error:", err));
}

/* =========================
   BATSMAN STATS DISPLAY
========================= */
function loadBatsmanStats() {
  if (!window.currentStrikerId || !window.currentNonStrikerId) return;

  fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;

      const s = d.stats[window.currentStrikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
      const ns = d.stats[window.currentNonStrikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 };

      el("striker").innerText =
        `* ${window.currentStrikerId}  ${s.runs} (${s.balls})  ${s.fours}x4 ${s.sixes}x6`;

      el("nonStriker").innerText =
        `${window.currentNonStrikerId}  ${ns.runs} (${ns.balls})`;
    })
    .catch(err => console.error("Batsman stats error:", err));
}

/* =========================
   STATE CONTROLLER
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  // normal wicket
  if (d.state === "WICKET" && d.wickets !== lastWicketCount) {
    lastWicketCount = d.wickets;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 6th ball wicket (two-step)
  if (d.state === "WICKET_OVER_END") {
    if (wicketOverStep === null) {
      lastWicketCount = d.wickets;
      wicketOverStep = "BATSMAN_DONE_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }

    if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = null;
      lastOverForBowlerPopup = d.over;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  // normal over end
  if (
    d.ball === 0 &&
    d.over !== lastOverForBowlerPopup &&
    d.state === "OVER_END"
  ) {
    lastOverForBowlerPopup = d.over;
    openPopup("BOWLER", "Select New Bowler");
    return;
  }

  // reset
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
  if (!v) return alert("Select player");

  // batsman change
  if (popupMode === "BATSMAN") {
    callAction(
      `${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`,
      true
    );

    if (el("state").innerText === "WICKET_OVER_END") {
      wicketOverStep = "BATSMAN_DONE";
    }

    closePopup();
    return;
  }

  // bowler change
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
    .finally(() => setTimeout(() => actionInProgress = false, 300));
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
