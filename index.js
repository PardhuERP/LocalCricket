const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

let lastHandledEventKey = null;      // 🔐 MASTER EVENT LOCK
let lastBowlerPopupOver = null;      // 🔐 BOWLER LOCK
let wicketOverStep = null;           // null | BATSMAN_DONE

/* =========================
   DOM HELPER
========================= */
const el = id => document.getElementById(id);

/* =========================
   LOAD LIVE SCORE
========================= */
function loadLiveScore() {
  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (!d || d.status !== "ok") {
  el("state").innerText = "WAITING...";
  return;
}

el("teamScore").innerText = `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;

// ✅ ALWAYS TRUST BACKEND STATE
el("state").innerText = d.state || "NORMAL";

      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      loadBowlerStats(d.bowlerId);

      handleStateUI(d);
    });
}

/* =========================
   BATSMEN
========================= */
function loadBatsmanStats(strikerId, nonStrikerId) {
  fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;
      renderBatsmen(d.stats, strikerId, nonStrikerId);
    });
}

function renderBatsmen(stats, strikerId, nonStrikerId) {
  const box = el("batsmanRows");
  box.innerHTML = "";

  [strikerId, nonStrikerId].forEach(pid => {
    if (!pid) return;

    const s = stats[pid] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const sr = s.balls ? ((s.runs / s.balls) * 100).toFixed(2) : "0.00";

    box.innerHTML += `
      <div class="table-row">
        <span class="name">${pid === strikerId ? '<span class="star">*</span>' : ''} ${pid}</span>
        <span>${s.runs}</span>
        <span>${s.balls}</span>
        <span>${s.fours}</span>
        <span>${s.sixes}</span>
        <span>${sr}</span>
      </div>
    `;
  });
}

/* =========================
   BOWLER
========================= */
function loadBowlerStats(bowlerId) {
  fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;
      renderBowler(bowlerId, d.stats?.[bowlerId] || {});
    });
}

function renderBowler(bowlerId, s = {}) {
  const overs = s.overs || 0;
  const maidens = s.maidens || 0;
  const runs = s.runsGiven || 0;
  const wickets = s.wickets || 0;
  const eco = overs ? (runs / overs).toFixed(2) : "0.00";

  el("bowlerRows").innerHTML = `
    <div class="table-row">
      <span class="name"><span class="star">*</span> ${bowlerId}</span>
      <span>${overs}</span>
      <span>${maidens}</span>
      <span>${runs}</span>
      <span>${wickets}</span>
      <span>${eco}</span>
    </div>
  `;
}

/* =========================
   STATE CONTROLLER (FINAL & SAFE)
========================= */
function handleStateUI(d) {
  if (!d || !d.state) return;
  if (popupActive) return;

  const eventKey = `${d.over}.${d.ball}_${d.state}`;
  if (eventKey === lastHandledEventKey) return;

  // 🔄 RESET
  if (d.state === "NORMAL") {
  lastHandledEvent = null;
  wicketOverStep = null;
  closePopup();
  return; // ❗ DO NOT TOUCH state text here
}

  // 🟡 NORMAL WICKET
  if (d.state === "WICKET") {
    lastHandledEventKey = eventKey;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟡 6th BALL WICKET (BATSMAN → BOWLER)
  if (d.state === "WICKET_OVER_END") {

    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_DONE_PENDING";
      lastHandledEventKey = eventKey;
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }

    if (
      wicketOverStep === "BATSMAN_DONE" &&
      lastBowlerPopupOver !== d.over
    ) {
      lastBowlerPopupOver = d.over;
      wicketOverStep = null;
      lastHandledEventKey = eventKey;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  // 🟢 NORMAL OVER END
  if (
    d.state === "OVER_END" &&
    lastBowlerPopupOver !== d.over
  ) {
    lastBowlerPopupOver = d.over;
    lastHandledEventKey = eventKey;
    openPopup("BOWLER", "Select New Bowler");
  }
}

/* =========================
   POPUP
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

function confirmPopup() {
  const v = el("popupSelect").value;
  if (!v) return alert("Select player");

  if (popupMode === "BATSMAN") {
    callAction(`${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`, true);
    if (el("state").innerText === "WICKET_OVER_END") wicketOverStep = "BATSMAN_DONE";
    closePopup();
    return;
  }

  if (popupMode === "BOWLER") {
    callAction(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`, true);

    wicketOverStep = null;
    lastHandledEventKey = null;
    lastBowlerPopupOver = null;

    closePopup();
  }
}

/* =========================
   API
========================= */
function callAction(url, force=false){
  if (actionInProgress && !force) return;
  actionInProgress = true;

  fetch(url)
    .then(() => loadLiveScore())
    .finally(() => setTimeout(()=>actionInProgress=false,300));
}

/* =========================
   BUTTONS
========================= */
function addRun(r){ callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`); }
function addExtra(t){ callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`); }
function addWicket(){ callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`); }
function undoBall(){
  popupActive = false;
  wicketOverStep = null;
  lastHandledEventKey = null;
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
