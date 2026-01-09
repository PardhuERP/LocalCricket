const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL FLAGS
========================= */
let actionInProgress = false;
let popupMode = null;
let popupActive = false;
let lastHandledState = null;
let wicketOverStep = null; 
// null | "BATSMAN_PENDING" | "BATSMAN_DONE" | "BOWLER_PENDING"

/* =========================
   TEST PLAYERS (MANUAL)
========================= */
const TEST_BATSMEN = ["BATSMAN_1","BATSMAN_2","BATSMAN_3","BATSMAN_4"];
const TEST_BOWLERS = ["BOWLER_1","BOWLER_2","BOWLER_3","BOWLER_4"];

/* =========================
   UI OVERRIDES (TEST ONLY)
========================= */
let uiStriker = null;
let uiNonStriker = null;
let uiBowler = null;

/* =========================
   HELPERS
========================= */
function el(id){ return document.getElementById(id); }

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

      // ✅ UI override first, backend fallback
      el("striker").innerText = uiStriker || d.strikerId;
      el("nonStriker").innerText = uiNonStriker || d.nonStrikerId;
      el("bowler").innerText = uiBowler || d.bowlerId;

      el("state").innerText = d.state;

      handleStateUI(d.state);
    })
    .catch(err => console.error("Live score error:", err));
}

/* =========================
   STATE CONTROLLER
========================= */
function handleStateUI(state){
  if (popupActive) return;

  if (state === "NORMAL") {
    lastHandledState = null;
    wicketOverStep = null;
    closePopup();
    return;
  }

  if (state === "WICKET") {
    if (lastHandledState === "WICKET") return;
    lastHandledState = "WICKET";
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  if (state === "OVER_END") {
    if (lastHandledState === "OVER_END") return;
    lastHandledState = "OVER_END";
    openPopup("BOWLER", "Select New Bowler");
    return;
  }

  if (state === "WICKET_OVER_END") {
    if (wicketOverStep === null) {
      wicketOverStep = "BATSMAN_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
      return;
    }
    if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = "BOWLER_PENDING";
      openPopup("BOWLER", "Select New Bowler");
      return;
    }
  }
}

/* =========================
   POPUP CONTROL
========================= */
function openPopup(mode, title){
  popupMode = mode;
  popupActive = true;

  el("popupTitle").innerText = title;

  let options = `<option value="">-- Select --</option>`;

  if (mode === "BATSMAN") {
    TEST_BATSMEN.forEach(p => options += `<option value="${p}">${p}</option>`);
  }
  if (mode === "BOWLER") {
    TEST_BOWLERS.forEach(p => options += `<option value="${p}">${p}</option>`);
  }

  el("popupSelect").innerHTML = options;
  el("popup").classList.remove("hidden");
}

function closePopup(){
  popupMode = null;
  popupActive = false;
  el("popup").classList.add("hidden");
}

/* =========================
   POPUP CONFIRM
========================= */
function confirmPopup(){
  const v = el("popupSelect").value;
  if (!v) return alert("Please select player");

  // 🟡 BATSMAN (NORMAL)
  if (popupMode === "BATSMAN" && el("state").innerText === "WICKET") {
    uiStriker = v;                    // ✅ UI UPDATE
    lastHandledState = "WICKET";
    closePopup();
    return;
  }

  // 🟡 BATSMAN (6th BALL)
  if (popupMode === "BATSMAN" && el("state").innerText === "WICKET_OVER_END") {
    uiStriker = v;                    // ✅ UI UPDATE
    wicketOverStep = "BATSMAN_DONE";
    closePopup();
    return;
  }

  // 🟢 BOWLER
  if (popupMode === "BOWLER") {
    uiBowler = v;                     // ✅ UI UPDATE

    callAction(
      `${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`,
      true
    );

    lastHandledState = "OVER_END";
    closePopup();
  }
}

/* =========================
   API CALL HANDLER
========================= */
function callAction(url, force = false){
  if (actionInProgress && !force) return;
  actionInProgress = true;

  fetch(url)
    .then(() => loadLiveScore())
    .finally(() => setTimeout(() => actionInProgress = false, 300));
}

/* =========================
   BUTTON ACTIONS
========================= */
function addRun(r){ callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`); }
function addExtra(t){ callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`); }
function addWicket(){ callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`); }
function undoBall(){ callAction(`${API}?action=undoBall&matchId=${MATCH_ID}`, true); }

/* =========================
   INIT
========================= */
window.onload = () => {
  loadLiveScore();
  setInterval(loadLiveScore, 2000);
};
