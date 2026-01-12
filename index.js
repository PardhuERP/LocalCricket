const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

let lastHandledEvent = null;     // WICKET_x | OVER_END_x
let wicketOverStep = null;       // null | BATSMAN_DONE
let scoreboardFrozen = false;

/* =========================
   DOM HELPER
========================= */
const el = id => document.getElementById(id);

/* =========================
   FREEZE / UNFREEZE UI
========================= */
function setScoreboardFrozen(freeze) {
  const board = document.querySelector(".scoreboard");
  if (!board) return;

  board.style.pointerEvents = freeze ? "none" : "auto";
  board.style.opacity = freeze ? "0.6" : "1";
  scoreboardFrozen = freeze;
}

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

      el("teamScore").innerText =
        `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
      el("state").innerText = d.state;

      // 🔒 FREEZE BASED ON STATE
      setScoreboardFrozen(d.state !== "NORMAL");

      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      loadBowlerStats(d.bowlerId);

      handleStateUI(d);
    })
    .catch(() => {
      el("state").innerText = "OFFLINE";
    });
}

/* =========================
   BATSMEN
========================= */
function loadBatsmanStats(strikerId, nonStrikerId) {
  fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status === "ok")
        renderBatsmen(d.stats, strikerId, nonStrikerId);
    });
}

function renderBatsmen(stats, strikerId, nonStrikerId) {
  const box = el("batsmanRows");
  box.innerHTML = "";

  [strikerId, nonStrikerId].forEach(pid => {
    if (!pid) return;

    const s = stats[pid] || { runs:0, balls:0, fours:0, sixes:0 };
    const sr = s.balls ? ((s.runs / s.balls) * 100).toFixed(2) : "0.00";
    const star = pid === strikerId ? '<span class="star">*</span>' : '';

    box.innerHTML += `
      <div class="table-row">
        <span class="name">${star} ${pid}</span>
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

      const s = d.stats && d.stats[bowlerId]
        ? d.stats[bowlerId]
        : { overs:0, maidens:0, runsGiven:0, wickets:0 };

      renderBowler(bowlerId, s);
    });
}

function renderBowler(bowlerId, s) {
  const eco = s.overs ? (s.runsGiven / s.overs).toFixed(2) : "0.00";

  el("bowlerRows").innerHTML = `
    <div class="table-row">
      <span class="name"><span class="star">*</span> ${bowlerId}</span>
      <span>${s.overs}</span>
      <span>${s.maidens}</span>
      <span>${s.runsGiven}</span>
      <span>${s.wickets}</span>
      <span>${eco}</span>
    </div>
  `;
}

/* =========================
   STATE CONTROLLER
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  // ✅ RESET
  if (d.state === "NORMAL") {
    lastHandledEvent = null;
    wicketOverStep = null;
    closePopup();
    return;
  }

  // 🟡 WICKET
  if (d.state === "WICKET" &&
      lastHandledEvent !== `WICKET_${d.wickets}`) {
    lastHandledEvent = `WICKET_${d.wickets}`;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟡 6th BALL WICKET
  if (d.state === "WICKET_OVER_END") {
    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_DONE_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }
    if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = null;
      lastHandledEvent = `OVER_END_${d.over}`;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  // 🟢 OVER END (NO WICKET)
  if (d.state === "OVER_END" &&
      lastHandledEvent !== `OVER_END_${d.over}`) {
    lastHandledEvent = `OVER_END_${d.over}`;
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
    if (el("state").innerText === "WICKET_OVER_END")
      wicketOverStep = "BATSMAN_DONE";

    callAction(`${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`, true);
    closePopup();
    return;
  }

  if (popupMode === "BOWLER") {
    lastHandledEvent = null;
    wicketOverStep = null;
    callAction(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`, true);
    closePopup();
  }
}

/* =========================
   API HELPER
========================= */
function callAction(url, force=false) {
  if (actionInProgress && !force) return;

  actionInProgress = true;
  fetch(url)
    .then(() => setTimeout(loadLiveScore, 600))
    .finally(() => setTimeout(() => actionInProgress=false, 1000));
}

/* =========================
   BUTTONS
========================= */
function addRun(r)   { if (!scoreboardFrozen) callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`); }
function addExtra(t) { if (!scoreboardFrozen) callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`); }
function addWicket() { if (!scoreboardFrozen) callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`); }

function undoBall() {
  lastHandledEvent = null;
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
