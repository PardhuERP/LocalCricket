const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

let lastHandledEvent = null;      // event key
let wicketOverStep = null;        // null | BATSMAN_DONE
let playLocked = false;           // 🔒 SCORE FREEZE LOCK

/* =========================
   DOM HELPER
========================= */
const el = id => document.getElementById(id);

/* =========================
   LOAD LIVE SCORE
========================= */
function loadLiveScore() {
  if (actionInProgress) return;

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

      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      loadBowlerStats(d.bowlerId);

      handleStateUI(d);
    })
    .catch(() => el("state").innerText = "OFFLINE");
}

/* =========================
   BATSMEN
========================= */
function loadBatsmanStats(strikerId, nonStrikerId) {
  fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status === "ok") {
        renderBatsmen(d.stats, strikerId, nonStrikerId);
      }
    });
}

function renderBatsmen(stats, strikerId, nonStrikerId) {
  const box = el("batsmanRows");
  box.innerHTML = "";

  [strikerId, nonStrikerId].forEach(pid => {
    if (!pid) return;

    const s = stats[pid] || { runs:0, balls:0, fours:0, sixes:0 };
    const sr = s.balls ? ((s.runs/s.balls)*100).toFixed(2) : "0.00";
    const star = pid === strikerId ? '<span class="star">*</span>' : '';

    box.innerHTML += `
      <div class="table-row">
        <span class="name">${star} ${pid}</span>
        <span>${s.runs}</span>
        <span>${s.balls}</span>
        <span>${s.fours}</span>
        <span>${s.sixes}</span>
        <span>${sr}</span>
      </div>`;
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
      <span>${s.overs || 0}</span>
      <span>${s.maidens || 0}</span>
      <span>${s.runsGiven || 0}</span>
      <span>${s.wickets || 0}</span>
      <span>${eco}</span>
    </div>`;
}

/* =========================
   STATE CONTROLLER (FINAL)
========================= */
function handleStateUI(d) {

  // 🔒 LOCK PLAY WHEN NOT NORMAL
  if (d.state !== "NORMAL") playLocked = true;

  // 🔓 UNLOCK ONLY WHEN NORMAL
  if (d.state === "NORMAL") {
    playLocked = false;
    lastHandledEvent = null;
    wicketOverStep = null;
    closePopup();
    return;
  }

  if (popupActive) return;

  // 🟡 NORMAL WICKET
  if (d.state === "WICKET") {
    const key = `WICKET_${d.wickets}`;
    if (lastHandledEvent === key) return;
    lastHandledEvent = key;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟡 6th BALL WICKET
  if (d.state === "WICKET_OVER_END") {

    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_PENDING";
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

  // 🟢 NORMAL OVER END
  if (d.state === "OVER_END") {
    const key = `OVER_END_${d.over}`;
    if (lastHandledEvent === key) return;
    lastHandledEvent = key;
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

  const state = el("state").innerText;
  const over = el("teamScore").innerText.split("(")[1].split(".")[0];

  if (popupMode === "BATSMAN") {
    if (state === "WICKET_OVER_END") wicketOverStep = "BATSMAN_DONE";
    callAction(`${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`, true);
  }

  if (popupMode === "BOWLER") {
    lastHandledEvent = `OVER_END_${over}`;
    wicketOverStep = null;
    callAction(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`, true);
  }

  closePopup();
}

/* =========================
   API CALL
========================= */
function callAction(url, force=false) {
  if (actionInProgress && !force) return;

  actionInProgress = true;
  el("state").innerText = "UPDATING...";

  fetch(url)
    .then(() => setTimeout(loadLiveScore, 600))
    .finally(() => {
      setTimeout(() => actionInProgress = false, 1200);
    });
}

/* =========================
   BUTTON ACTIONS (LOCKED)
========================= */
function addRun(r)   { if (!playLocked) callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`); }
function addExtra(t) { if (!playLocked) callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`); }
function addWicket() { if (!playLocked) callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`); }

function undoBall() {
  playLocked = false;
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
