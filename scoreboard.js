const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";
const MATCH_ID = "MATCH_1768804773924";

const el = id => document.getElementById(id);

/* =========================
   LOAD LIVE SCORE
========================= */
async function loadLive(){
  const r = await fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`);
  const d = await r.json();
  if(d.status !== "ok") return;

  el("teamScore").innerText = `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;

  const balls = d.over * 6 + d.ball;
  const crr = balls ? (d.totalRuns / (balls/6)).toFixed(2) : "0.00";
  el("crr").innerText = `CRR ${crr}`;
  el("pship").innerText = `P'SHIP ${d.partnershipRuns || 0}(${d.partnershipBalls || 0})`;

  loadBatters(d.strikerId, d.nonStrikerId);
  loadBowler(d.bowlerId);
  handleStateUI(d);   // 🔥 THIS WAS MISSING
}

/* =========================
   PLAYER NAME
========================= */
async function getName(id){
  if(!id) return "";
  const r = await fetch(`${API}?action=getPlayerName&playerId=${id}`);
  const d = await r.json();
  return d.name || id;
}

/* =========================
   BATTERS
========================= */
async function loadBatters(strikerId, nonStrikerId){
  const r = await fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`);
  const d = await r.json();

  const s = d.stats[strikerId] || {runs:0,balls:0,fours:0,sixes:0};
  const n = d.stats[nonStrikerId] || {runs:0,balls:0,fours:0,sixes:0};

  const sr1 = s.balls ? ((s.runs/s.balls)*100).toFixed(2) : "0.00";
  const sr2 = n.balls ? ((n.runs/n.balls)*100).toFixed(2) : "0.00";

  const sn = await getName(strikerId);
  const nn = await getName(nonStrikerId);

  el("batRows").innerHTML = `
    <div class="row">
      <span class="name star">* ${sn}</span>
      <span>${s.runs}</span>
      <span>${s.balls}</span>
      <span>${s.fours}</span>
      <span>${s.sixes}</span>
      <span>${sr1}</span>
    </div>

    <div class="row">
      <span class="name">${nn}</span>
      <span>${n.runs}</span>
      <span>${n.balls}</span>
      <span>${n.fours}</span>
      <span>${n.sixes}</span>
      <span>${sr2}</span>
    </div>
  `;
}

/* =========================
   BOWLER
========================= */
async function loadBowler(id){
  if(!id){
    el("bowlRows").innerHTML = "";
    return;
  }

  const [sr, name] = await Promise.all([
    fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`).then(r=>r.json()),
    getName(id)
  ]);

  const b = sr.stats[id] || {overs:0,balls:0,maidens:0,runsGiven:0,wickets:0};
  const overs = `${b.overs}.${b.balls || 0}`;
  const eco = b.overs ? (b.runsGiven / b.overs).toFixed(2) : "0.00";

  el("bowlRows").innerHTML = `
    <div class="row">
      <span class="name star">* ${name}</span>
      <span>${overs}</span>
      <span>${b.maidens}</span>
      <span>${b.runsGiven}</span>
      <span>${b.wickets}</span>
      <span>${eco}</span>
    </div>
  `;
}
/* =========================
   HANDL UI
========================= */

let lastHandledState = null;

function handleStateUI(d){
  if(!d || !d.state) return;

  // prevent duplicate popups
  const key = `${d.state}_${d.over}_${d.ball}`;
  if(lastHandledState === key) return;

  if(d.state === "OVER_END"){
    lastHandledState = key;
    openBowlerPopup();
  }
}
/* =========================
   Popup 
========================= */
function openBowlerPopup(){
  const bowlerId = prompt("Over completed. Enter NEW Bowler ID:");
  if(!bowlerId) return;

  fetch(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${bowlerId}`)
    .then(() => setTimeout(loadLive, 500));
}

let popupActive = false;

function handleStateUI(d) {
  if (popupActive) return;

  if (d.state === "OVER_END") {
    popupActive = true;
    openBowlerPopup();
  }

  if (d.state === "NORMAL") {
    popupActive = false;
  }
}

/* =========================
   MIC
========================= */
function startMic(){
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.lang = "en-IN";
  rec.start();

  rec.onresult = e => {
    const t = e.results[0][0].transcript.toLowerCase();

    if(t.includes("six")) addRun(6);
    else if(t.includes("four")) addRun(4);
    else if(t.includes("two")) addRun(2);
    else if(t.includes("one")) addRun(1);
    else if(t.includes("dot") || t.includes("zero")) addRun(0);
    else if(t.includes("wide")) addExtra("WD");
    else if(t.includes("no ball")) addExtra("NB");
    else if(t.includes("out")) addWicket();
  };
}

/* =========================
   ACTION HELPERS
========================= */
const call = url =>
  fetch(url).then(() => setTimeout(loadLive, 300));

function addRun(r){
  call(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`);
}

function addExtra(type){
  call(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${type}`);
}

function addWicket(){
  call(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`);
}

/* RUN OUT – TEMP SIMPLE (popup later) */
function addRunOut(){
  const out = confirm("Is NON-STRIKER out?")
    ? "NON_STRIKER"
    : "STRIKER";

  call(`${API}?action=addRunOut&matchId=${MATCH_ID}&out=${out}`);
}

function undoBall(){
  call(`${API}?action=undoBall&matchId=${MATCH_ID}`);
}



/* =========================
   INIT
========================= */
loadLive();
setInterval(loadLive, 2000);
