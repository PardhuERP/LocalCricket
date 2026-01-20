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
   INIT
========================= */
loadLive();
setInterval(loadLive, 2000);
