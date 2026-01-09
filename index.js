const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let actionInProgress = false;
let popupMode = null;
let popupActive = false;
let lastHandledState = null;   // ✅ ADDED (VERY IMPORTANT)

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
  // 🚫 do not re-handle same state
  if (state === lastHandledState) return;

  // 🚫 do not react while popup open
  if (popupActive) return;

  if (state === "WICKET") {
    lastHandledState = "WICKET";
    openPopup("BATSMAN", "Select New Batsman");
  }
  else if (state === "OVER_END") {
    lastHandledState = "OVER_END";
    openPopup("BOWLER", "Select New Bowler");
  }
  else if (state === "WICKET_OVER_END") {
    lastHandledState = "WICKET_OVER_END";
    openPopup("BATSMAN", "Select New Batsman");
  }
  else {
    lastHandledState = null;   // ✅ reset when NORMAL
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

  // 🔹 BATSMAN (TEMP until backend API)
  if (popupMode === "BATSMAN") {
    console.log("New batsman selected:", v);

    // mark wicket as handled
    lastHandledState = "WICKET";

    closePopup();
    return;
  }

  // 🔹 BOWLER
  if (popupMode === "BOWLER") {
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
  callAction(`${API}?action=undoBall&matchId=${MATCH_ID}`, true);
}

/* =========================
   INIT
========================= */
window.onload = () => {
  loadLiveScore();
  setInterval(loadLiveScore, 2000);
};
