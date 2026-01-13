const MATCH_ID = "MATCH_1767874129183";
const API =
  "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   GLOBAL STATE
========================= */
let actionInProgress = false;
let popupActive = false;
let popupMode = null;

let lastHandledEvent = null;
let wicketOverStep = null;

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
      if (!d || d.status !== "ok") return;

      el("teamScore").innerText =
        `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
      el("state").innerText = d.state || "NORMAL";

      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      loadBowlerStats(d.bowlerId);

      handleStateUI(d);
    })
    .catch(err => console.error("Load Error:", err));
}

/* =========================
   API CALL HELPER
========================= */
function callAction(url, force = false) {
  if (actionInProgress && !force) return;

  actionInProgress = true;
  el("state").innerText = "UPDATING...";

  fetch(url)
    .then(r => r.json())
    .then(() => {
      setTimeout(loadLiveScore, 700);
      setTimeout(loadLiveScore, 1400);
    })
    .finally(() => {
      setTimeout(() => {
        actionInProgress = false;
      }, 1500);
    });
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

    const s = stats[pid] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const sr = s.balls ? ((s.runs / s.balls) * 100).toFixed(2) : "0.00";
    const isStriker = pid === strikerId;

    box.innerHTML += `
      <div class="table-row">
        <span class="name">
          ${isStriker ? '<span class="star">*</span>' : ""} ${pid}
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
function loadBowlerStats(bowlerId) {
  fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;

      const s = d.stats[bowlerId] || {
        overs: 0,
        maidens: 0,
        runsGiven: 0,
        wickets: 0
      };

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

  if (d.state === "NORMAL") {
    lastHandledEvent = null;
    wicketOverStep = null;
    return;
  }

  // WICKET
  if (
    d.state === "WICKET" &&
    lastHandledEvent !== `WICKET_${d.wickets}`
  ) {
    lastHandledEvent = `WICKET_${d.wickets}`;
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  // 6th BALL WICKET
  if (d.state === "WICKET_OVER_END") {
    if (!wicketOverStep) {
      wicketOverStep = "BATSMAN_PENDING";
      openPopup("BATSMAN", "Select New Batsman");
    } else if (
      wicketOverStep === "BATSMAN_DONE" &&
      lastHandledEvent !== `OVER_END_${d.over}`
    ) {
      lastHandledEvent = `OVER_END_${d.over}`;
      openPopup("BOWLER", "Select New Bowler");
    }
    return;
  }

  // NORMAL OVER END
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

  if (mode === "RUNOUT") {
    el("popupSelect").innerHTML = `
      <option value="">-- Select --</option>
      <option value="STRIKER">Striker</option>
      <option value="NON_STRIKER">Non-Striker</option>
    `;
  } else {
    el("popupSelect").innerHTML = `
      <option value="">-- Select --</option>
      <option value="PLAYER_1">PLAYER_1</option>
      <option value="PLAYER_2">PLAYER_2</option>
      <option value="PLAYER_3">PLAYER_3</option>
    `;
  }

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

  const currentState = el("state").innerText;
  const currentOver = el("teamScore").innerText.split("(")[1].split(".")[0];
  const currentWickets =
    el("teamScore").innerText.split("-")[1].split(" ")[0];

  if (popupMode === "RUNOUT") {
    lastHandledEvent = `WICKET_${currentWickets}`;
    callAction(
      `${API}?action=addRunOut&matchId=${MATCH_ID}&out=${v}`,
      true
    );
    closePopup();
    return;
  }

  if (popupMode === "BATSMAN") {
    lastHandledEvent = `WICKET_${currentWickets}`;
    if (currentState === "WICKET_OVER_END") {
      wicketOverStep = "BATSMAN_DONE";
    }
    callAction(
      `${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`,
      true
    );
    closePopup();
    return;
  }

  if (popupMode === "BOWLER") {
    lastHandledEvent = `OVER_END_${currentOver}`;
    wicketOverStep = null;
    callAction(
      `${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`,
      true
    );
    closePopup();
  }
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
  callAction(
    `${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`
  );
}

function openRunOutPopup() {
  openPopup("RUNOUT", "Run Out – Who is Out?");
}

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
