const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

// 🔐 VERY IMPORTANT LOCK
let lastHandledBallKey = null; // "over.ball"
let wicketOverStep = null;     // null | "BATSMAN_DONE"

/* batsman holders */
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
      if (d.status !== "ok") return;
// fetch batsman stats
fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
  .then(r => r.json())
  .then(s => {
    if (s.status === "ok") {
      renderBatsmen(s.stats, d.strikerId, d.nonStrikerId);
      renderBowler(d.bowlerId);
    }
  });

/* =========================
   BATSMAN STATS
========================= */
function loadBatsmanStats() {
  if (!currentStrikerId || !currentNonStrikerId) return;

  fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;

      const s = d.stats[currentStrikerId] || { runs:0, balls:0, fours:0, sixes:0 };
      const ns = d.stats[currentNonStrikerId] || { runs:0, balls:0, fours:0, sixes:0 };

      el("striker").innerText =
        `* ${currentStrikerId}  ${s.runs} (${s.balls})  ${s.fours}x4 ${s.sixes}x6`;

      el("nonStriker").innerText =
        `${currentNonStrikerId}  ${ns.runs} (${ns.balls})`;
    });
}


function renderBatsmen(stats, strikerId, nonStrikerId) {
  const box = document.getElementById("batsmanRows");
  if (!box) return;

  box.innerHTML = "";

  [strikerId, nonStrikerId].forEach((pid, i) => {
    if (!stats[pid]) return;

    const s = stats[pid];
    const sr = s.balls ? ((s.runs / s.balls) * 100).toFixed(2) : "0.00";

    box.innerHTML += `
      <div class="table-row">
        <span class="name">${i === 0 ? '<span class="star">*</span>' : ''} ${pid}</span>
        <span>${s.runs}</span>
        <span>${s.balls}</span>
        <span>${s.fours}</span>
        <span>${s.sixes}</span>
        <span>${sr}</span>
      </div>
    `;
  });
}

function renderBowler(bowlerId) {
  document.getElementById("bowlerRows").innerHTML = `
    <div class="table-row">
      <span class="name"><span class="star">*</span> ${bowlerId}</span>
      <span>-</span><span>-</span><span>-</span><span>-</span><span>-</span>
    </div>
  `;
}
/* =========================
   STATE CONTROLLER (FINAL)
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  const ballKey = `${d.over}.${d.ball}`;
  if (ballKey === lastHandledBallKey) return;

  // 🟥 NORMAL WICKET
  if (d.state === "WICKET") {
    lastHandledBallKey = ballKey;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟥 6th BALL WICKET
  if (d.state === "WICKET_OVER_END") {

    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_DONE_PENDING";
      lastHandledBallKey = ballKey;
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }

    if (wicketOverStep === "BATSMAN_DONE")
    
    {
      wicketOverStep = null;
      lastHandledBallKey = ballKey;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  // 🟦 NORMAL OVER END
  if (d.state === "OVER_END") {
    lastHandledBallKey = ballKey;
    openPopup("BOWLER", "Select New Bowler");
    return;
  }

  // 🟢 RESET
  if (d.state === "NORMAL") {
    wicketOverStep = null;
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
  popupActive = false;
  popupMode = null;
  el("popup").classList.add("hidden");
}

/* =========================
   POPUP CONFIRM
========================= */
function confirmPopup() {
  const v = el("popupSelect").value;
  if (!v) return alert("Select player");

  if (popupMode === "BATSMAN") {
    callAction(`${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`, true);

    if (el("state").innerText === "WICKET_OVER_END") {
      wicketOverStep = "BATSMAN_DONE";
    }

    closePopup();
    return;
  }

  if (popupMode === "BOWLER") {
    callAction(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`, true);
    closePopup();
  }
}

/* =========================
   API HELPER
========================= */
function callAction(url, force = false) {
  if (actionInProgress && !force) return;
  actionInProgress = true;

  fetch(url)
    .then(() => loadLiveScore())
    .finally(() => setTimeout(() => actionInProgress = false, 300));
}

/* =========================
   BUTTONS
========================= */
function addRun(r){ callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`); }
function addExtra(t){ callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`); }
function addWicket(){ callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`); }
function undoBall(){
  popupActive=false;
  wicketOverStep=null;
  lastHandledBallKey=null;
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
