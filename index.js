const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   DOM HELPER
========================= */
function el(id) {
  return document.getElementById(id);
}

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

let wicketOverStep = null;     // null | "BATSMAN_DONE"
let lastEventKey = null;       // `${over}.${ball}:${state}`

/* =========================
   LOAD LIVE SCORE
========================= */
function loadLiveScore() {
  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      console.log("LIVE_STATE:", d);

      if (d.status !== "ok") return;

      // HEADER
      el("teamScore").innerText =
        `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
      el("state").innerText = d.state;

      // TABLES
      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      renderBowler(d.bowlerId);

      // POPUP FLOW
      handleStateUI(d);
    })
    .catch(err => console.error("loadLiveScore error:", err));
}

/* =========================
   BATSMEN
========================= */
function loadBatsmanStats(strikerId, nonStrikerId) {
  fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;
      renderBatsmen(d.stats || {}, strikerId, nonStrikerId);
    });
}

function renderBatsmen(stats, strikerId, nonStrikerId) {
  const box = el("batsmanRows");
  if (!box) return;

  box.innerHTML = "";

  [strikerId, nonStrikerId].forEach(pid => {
    if (!pid) return;

    const s = stats[pid] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const sr = s.balls ? ((s.runs / s.balls) * 100).toFixed(2) : "0.00";
    const isStriker = pid === strikerId;

    box.innerHTML += `
      <div class="table-row">
        <span class="name">
          ${isStriker ? '<span class="star">*</span>' : ''} ${pid}
        </span>
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
function renderBowler(bowlerId) {
  el("bowlerRows").innerHTML = `
    <div class="table-row">
      <span class="name"><span class="star">*</span> ${bowlerId || "-"}</span>
      <span>-</span><span>-</span><span>-</span><span>-</span><span>-</span>
    </div>
  `;
}

/* =========================
   STATE CONTROLLER
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  const eventKey = `${d.over}.${d.ball}:${d.state}`;
  if (eventKey === lastEventKey) return; // 🔒 prevent loops
  lastEventKey = eventKey;

  // 🟢 NORMAL RESET
  if (d.state === "NORMAL") {
    wicketOverStep = null;
    closePopup();
    return;
  }

  // 🟡 NORMAL WICKET
  if (d.state === "WICKET") {
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🔴 6th BALL WICKET
  if (d.state === "WICKET_OVER_END") {

    // STEP 1 – BATSMAN
    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_DONE_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }

    // STEP 2 – BOWLER
    if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = null;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  // 🟢 OVER END (NO WICKET)
  if (d.state === "OVER_END") {
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

  if (popupMode === "BOWLER") {
    callAction(
      `${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`,
      true
    );
    closePopup();
  }
}

/* =========================
   API CALL HELPER
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
   BUTTONS
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
  wicketOverStep = null;
  lastEventKey = null;
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
