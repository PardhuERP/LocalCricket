const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

let lastHandledBallKey = null;   // over.ball
let wicketOverStep = null;       // null | BATSMAN_DONE

let currentStrikerId = null;
let currentNonStrikerId = null;

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

      // header
      el("teamScore").innerText = `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
      el("state").innerText = d.state;

      // simple view
      currentStrikerId = d.strikerId;
      currentNonStrikerId = d.nonStrikerId;

      el("striker").innerText = d.strikerId || "-";
      el("nonStriker").innerText = d.nonStrikerId || "-";
      el("bowler").innerText = d.bowlerId || "-";

      handleStateUI(d);

      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      renderBowler(d.bowlerId);
    });
}

/* =========================
   BATSMAN STATS
========================= */
function loadBatsmanStats(strikerId, nonStrikerId) {
  fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;

      renderBatsmen(d.stats, strikerId, nonStrikerId);

      // simple view with runs
      const s = d.stats[strikerId] || {};
      const ns = d.stats[nonStrikerId] || {};

      el("striker").innerText =
        `* ${strikerId} ${s.runs || 0} (${s.balls || 0}) ${s.fours || 0}x4 ${s.sixes || 0}x6`;

      el("nonStriker").innerText =
        `${nonStrikerId} ${ns.runs || 0} (${ns.balls || 0})`;
    });
}

function renderBatsmen(stats, strikerId, nonStrikerId) {
  const box = el("batsmanRows");
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

/* =========================
   BOWLER (SIMPLE FOR NOW)
========================= */
function renderBowler(bowlerId) {
  el("bowlerRows").innerHTML = `
    <div class="table-row">
      <span class="name"><span class="star">*</span> ${bowlerId}</span>
      <span>-</span><span>-</span><span>-</span><span>-</span><span>-</span>
    </div>
  `;
}

/* =========================
   STATE CONTROLLER
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  const ballKey = `${d.over}.${d.ball}`;
  if (ballKey === lastHandledBallKey) return;

  if (d.state === "WICKET") {
    lastHandledBallKey = ballKey;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  if (d.state === "WICKET_OVER_END") {
    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_DONE_PENDING";
      lastHandledBallKey = ballKey;
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }
    if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = null;
      lastHandledBallKey = ballKey;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  if (d.state === "OVER_END") {
    lastHandledBallKey = ballKey;
    openPopup("BOWLER", "Select New Bowler");
    return;
  }

  if (d.state === "NORMAL") {
    wicketOverStep = null;
    closePopup();
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
    closePopup();
  }
}

/* =========================
   API HELPER
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
