const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

let lastHandledEvent = null;      // "WICKET" | "OVER_END" | null
let wicketOverStep = null;        // null | "BATSMAN_DONE"

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
      if (d.status !== "ok") return;

      // HEADER
      el("teamScore").innerText = `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
      el("state").innerText = d.state;

      // TABLES
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
    const isStriker = pid === strikerId;

    box.innerHTML += `
      <div class="table-row">
        <span class="name">${isStriker ? '<span class="star">*</span>' : ''} ${pid}</span>
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

      // ✅ SAFE FALLBACK (VERY IMPORTANT)
      const s = (d.stats && d.stats[bowlerId])
        ? d.stats[bowlerId]
        : {
            overs: 0,
            maidens: 0,
            runsGiven: 0,
            wickets: 0
          };

      renderBowler(bowlerId, s);
    });
}

/* =========================
   STATE CONTROLLER (FINAL)
========================= */
function handleStateUI(d) {
  if (popupActive) return;

  // ✅ HARD RESET WHEN PLAY RESUMES
  if (d.state === "NORMAL") {
    lastHandledEvent = null;
    wicketOverStep = null;
    closePopup();
    return;
  }

  // 🟡 NORMAL WICKET (ANY BALL)
  if (d.state === "WICKET" && lastHandledEvent !== `WICKET_${d.wickets}`) {
    lastHandledEvent = `WICKET_${d.wickets}`;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 🟡 6th BALL WICKET (2-STEP FLOW)
  if (d.state === "WICKET_OVER_END") {

    // STEP 1 → BATSMAN
    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_DONE_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }

    // STEP 2 → BOWLER
    if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = null;
      lastHandledEvent = `OVER_END_${d.over}`;
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }

  // 🟢 NORMAL OVER END (ONCE PER OVER)
  if (
    d.state === "OVER_END" &&
    lastHandledEvent !== `OVER_END_${d.over}`
  ) {
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

  // 🟡 BATSMAN CONFIRM
  if (popupMode === "BATSMAN") {
    callAction(`${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`, true);

    if (el("state").innerText === "WICKET_OVER_END") {
      wicketOverStep = "BATSMAN_DONE"; // ✅ IMPORTANT
    }

    closePopup();
    return;
  }

  // 🟢 BOWLER CONFIRM
  if (popupMode === "BOWLER") {
    callAction(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`, true);
    wicketOverStep = null;          // ✅ KILL EXTRA BATSMAN POPUP
    lastHandledEvent = null;        // ✅ RESET EVENT
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
  lastHandledEvent = null;
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
