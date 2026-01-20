const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";
const MATCH_ID=new URLSearchParams(window.location.search).get("matchId");

const el=id=>document.getElementById(id);

/* PLAYER NAME */
async function getName(id){
 if(!id) return "";
 const r=await fetch(`${API}?action=getPlayerName&playerId=${id}`);
 const d=await r.json();
 return d.name||id;
}

/* TEAM NAME */
async function getTeamName(id){
 const r=await fetch(`${API}?action=getTeamName&teamId=${id}`);
 const d=await r.json();
 return d.name||id;
}

/* LIVE */
async function loadLive(){
 if(!MATCH_ID) return;

 const res=await fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`);
 const d=await res.json();
 if(d.status!=="ok") return;

 const over=Number(d.over)||0;
 const ball=Number(d.ball)||0;
 const balls=over*6+ball;

 const team=await getTeamName(d.battingTeamId);
 el("teamName").innerText=team;
 el("teamScore").innerText=`${d.totalRuns}-${d.wickets} (${over}.${ball})`;

 const crr=balls?(d.totalRuns/(balls/6)).toFixed(2):"0.00";
 el("crr").innerText=`CRR ${crr}`;
 el("pship").innerText=`P'SHIP ${d.partnershipRuns||0}(${d.partnershipBalls||0})`;

 loadBatters(d.strikerId,d.nonStrikerId);
 loadBowler(d.bowlerId);
}

/* BATTERS */
async function loadBatters(strikerId, nonStrikerId){

  if(!strikerId && !nonStrikerId){
    el("batRows").innerHTML="";
    return;
  }

 console.log("BAT UI:", strikerId, nonStrikerId);

  const r = await fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`);
  const d = await r.json();

  const a = d.stats[strikerId] || {runs:0,balls:0,fours:0,sixes:0};
  const b = d.stats[nonStrikerId] || {runs:0,balls:0,fours:0,sixes:0};

  const sr1 = a.balls ? ((a.runs/a.balls)*100).toFixed(2) : "0.00";
  const sr2 = b.balls ? ((b.runs/b.balls)*100).toFixed(2) : "0.00";

  const sn = await getName(strikerId);
  const nn = await getName(nonStrikerId);

  el("batRows").innerHTML = `
  <div class="row">
    <span class="name star">* ${sn}</span>
    <span>${a.runs}</span>
    <span>${a.balls}</span>
    <span>${a.fours}</span>
    <span>${a.sixes}</span>
    <span>${sr1}</span>
  </div>

  <div class="row">
    <span>${nn}</span>
    <span>${b.runs}</span>
    <span>${b.balls}</span>
    <span>${b.fours}</span>
    <span>${b.sixes}</span>
    <span>${sr2}</span>
  </div>`;
}

/* BOWLER */
async function loadBowler(id){
 if(!id){ el("bowlRows").innerHTML=""; return;}

 const [sr,name]=await Promise.all([
 fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`).then(r=>r.json()),
 getName(id)
 ]);

 const b=sr.stats[id]||{overs:0,balls:0,maidens:0,runsGiven:0,wickets:0};
 const overs=`${b.overs}.${b.balls||0}`;
 const eco=b.overs?(b.runsGiven/b.overs).toFixed(2):"0.00";

 el("bowlRows").innerHTML=`
 <div class="row"><span class="name star">* ${name}</span><span>${overs}</span><span>${b.maidens}</span><span>${b.runsGiven}</span><span>${b.wickets}</span><span>${eco}</span></div>`;
}

loadLive();
setInterval(loadLive,2000);
