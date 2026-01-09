const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let actionInProgress = false;
let popupMode = null;
let popupActive = false;
let lastHandledState = null;   // ✅ ADDED (VERY IMPORTANT)

function el(id){ return document.getElementById(id); }
let wicketOverStep = null; 
// null | "BATSMAN_DONE" | "BOWLER_DONE"

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

      handleStateUI(d.state);
    })
    .catch(err => console.error("Live score error:", err));
}

/* =========================
   STATE CONTROLLER
========================= */
function handleStateUI(state){
  if (popupActive) return;

  if (state === "WICKET") {
    if (lastHandledState === "WICKET") return;
    lastHandledState = "WICKET";
    openPopup("BATSMAN", "Select New Batsman");
  }

  else if (state === "OVER_END") {
    if (lastHandledState === "OVER_END") return;
    lastHandledState = "OVER_END";
    openPopup("BOWLER", "Select New Bowler");
  }

  else if (state === "WICKET_OVER_END") {
    // 🧠 TWO-STEP FLOW
    if (wicketOverStep === null) {
      wicketOverStep = "BATSMAN_DONE_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
    }
    else if (wicketOverStep === "BATSMAN_DONE") {
      wicketOverStep = "BOWLER_DONE_PENDING";
      openPopup("BOWLER", "Select New Bowler");
    }
  }

  else {
    lastHandledState = null;
    wicketOverStep = null;   // ✅ RESET
    closePopup();
  }
}

/* =========================
   POPUP CONTROL
========================= */
function openPopup(mode, title){
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
  if (!v) {
    alert("Please select player");
    return;
  }

  // 🟡 WICKET OVER – BATSMAN STEP
  if (popupMode === "BATSMAN" && el("state").innerText === "WICKET_OVER_END") {
  console.log("New batsman selected:", v);
  wicketOverStep = "BATSMAN_DONE";
  lastHandledState = null;   // ✅ ADD
  closePopup();
  return;
}

  // 🟡 NORMAL WICKET
  if (popupMode === "BATSMAN") {
    console.log("New batsman selected:", v);
    lastHandledState = "WICKET";
    closePopup();
    return;
  }

  // 🟢 BOWLER (NORMAL + WICKET_OVER_END)
  if (popupMode === "BOWLER") {
    callAction(
      `${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`,
      true
    );

    if (el("state").innerText === "WICKET_OVER_END") {
      wicketOverStep = "BOWLER_DONE";
    } else {
      lastHandledState = "OVER_END";
    }

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
    .catch(err => console.error("Action error:", err))
    .finally(() => {
      setTimeout(() => actionInProgress = false, 300);
    });
}

/* =========================
   BUTTON ACTIONS
========================= */
function addRun(r){
  callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`);
}

function addExtra(t){
  callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`);
}

function addWicket(){
  callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`);
}

function undoBall(){
  console.log("UNDO CLICKED");

  console.log("Before reset:", {
    popupActive,
    popupMode,
    lastHandledState,
    wicketOverStep
  });

  // 🔄 FULL UI RESET
  popupActive = false;
  popupMode = null;
  lastHandledState = null;
  wicketOverStep = null;

  closePopup();

  console.log("After reset:", {
    popupActive,
    popupMode,
    lastHandledState,
    wicketOverStep
  });

  // 🚨 IMPORTANT: force undo even if another action is running
  fetch(`${API}?action=undoBall&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(res => {
      console.log("UNDO API response:", res);

      // 🔁 reload state AFTER undo
      setTimeout(loadLiveScore, 200);
    })
    .catch(err => console.error("Undo error:", err))
    .finally(() => {
      actionInProgress = false; // hard release lock
    });
}

/* =========================
   INIT
========================= */
window.onload = () => {
  loadLiveScore();
  setInterval(loadLiveScore, 2000);
};
