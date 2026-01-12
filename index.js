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
   LOAD LIVE SCORE (OPTIMIZED)
========================= */
function loadLiveScore() {
  // Action జరుగుతున్నప్పుడు కూడా డేటా తెచ్చుకోవచ్చు, 
  // కానీ పాపప్స్ ట్రిగ్గర్ అవ్వకుండా handleStateUI ని కంట్రోల్ చేస్తాం.
  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (!d || d.status !== "ok") return;

      // Update UI Immediately
      el("teamScore").innerText = `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
      el("state").innerText = d.state || "NORMAL";

      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      loadBowlerStats(d.bowlerId);

      // actionInProgress ఉన్నప్పుడు పాపప్ లాజిక్ రన్ చేయవద్దు
      if (!actionInProgress) {
        handleStateUI(d);
      }
    })
    .catch(err => console.error("Load Error:", err));
}

/* =========================
   API HELPER (FAST REFLECT)
========================= */
function callAction(url, force = false) {
  if (actionInProgress && !force) return;
  
  actionInProgress = true;

  fetch(url)
    .then(r => r.json())
    .then(res => {
      // GSheet అప్‌డేట్ అయ్యాక వెంటనే UI అప్‌డేట్ చేయాలి
      // ఇక్కడ వెయిటింగ్ అవసరం లేదు
      loadLiveScore(); 
    })
    .catch(err => console.error("Action Error:", err))
    .finally(() => {
      // 500ms తర్వాత మళ్ళీ కొత్త పాపప్స్ కోసం అనుమతించాలి
      setTimeout(() => { actionInProgress = false; }, 500);
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

    const s = stats[pid] || {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0
    };

    const sr = s.balls
      ? ((s.runs / s.balls) * 100).toFixed(2)
      : "0.00";

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

      const s =
        d.stats && d.stats[bowlerId]
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

function renderBowler(bowlerId, s) {
  const eco = s.overs
    ? (s.runsGiven / s.overs).toFixed(2)
    : "0.00";

  el("bowlerRows").innerHTML = `
    <div class="table-row">
      <span class="name">
        <span class="star">*</span> ${bowlerId}
      </span>
      <span>${s.overs || 0}</span>
      <span>${s.maidens || 0}</span>
      <span>${s.runsGiven || 0}</span>
      <span>${s.wickets || 0}</span>
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

  if (
    d.state === "WICKET" &&
    lastHandledEvent !== `WICKET_${d.wickets}`
  ) {
    openPopup("BATSMAN", "Select New Batsman");
    return;
  }

  if (d.state === "WICKET_OVER_END") {
    if (!wicketOverStep) {
      openPopup("BATSMAN", "Select New Batsman");
    } else if (
      wicketOverStep === "BATSMAN_DONE" &&
      lastHandledEvent !== `OVER_END_${d.over}`
    ) {
      openPopup("BOWLER", "Select New Bowler");
    }
    return;
  }

  if (
    d.state === "OVER_END" &&
    lastHandledEvent !== `OVER_END_${d.over}`
  ) {
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

  const currentState = el("state").innerText;
  const currentWickets =
    el("teamScore").innerText.split("-")[1].split(" ")[0];
  const currentOver =
    el("teamScore").innerText.split("(")[1].split(".")[0];

  if (popupMode === "BATSMAN") {
    lastHandledEvent = `WICKET_${currentWickets}`;
    if (currentState === "WICKET_OVER_END") {
      wicketOverStep = "BATSMAN_DONE";
    }

    callAction(
      `${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`,
      true
    );
  } else if (popupMode === "BOWLER") {
    lastHandledEvent = `OVER_END_${currentOver}`;
    wicketOverStep = null;

    callAction(
      `${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`,
      true
    );
  }

  closePopup();
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
