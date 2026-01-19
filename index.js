const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

// ⚠️ Public page lo matchId manual ga set cheyyali
const MATCH_ID="MATCH_1768804773924";

const el=id=>document.getElementById(id);

/* ================= LIVE STATE ================= */
function loadLive(){
fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
if(d.status!=="ok") return;

el("teamName").innerText=d.battingTeamName || "TEAM";
el("teamScore").innerText=`${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;

const balls = d.over*6 + d.ball || 0;
const crr = balls ? (d.totalRuns/(balls/6)).toFixed(2) : "0.00";
el("crr").innerText=`CRR ${crr}`;

el("pship").innerText=`P'SHIP ${d.partnershipRuns || 0}(${d.partnershipBalls || 0})`;

loadBatters(d.strikerId,d.nonStrikerId);
loadBowler(d.bowlerId);
});
}

/* ================= BATSMEN ================= */
function loadBatters(striker,nonStriker){
fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
if(d.status!=="ok") return;

const s1=d.stats[striker]||{runs:0,balls:0,fours:0,sixes:0};
const s2=d.stats[nonStriker]||{runs:0,balls:0,fours:0,sixes:0};

const sr1=s1.balls?((s1.runs/s1.balls)*100).toFixed(2):"0.00";
const sr2=s2.balls?((s2.runs/s2.balls)*100).toFixed(2):"0.00";

el("batRows").innerHTML=`
<div class="row"><span class="name"><span class="star">*</span>${striker}</span><span>${s1.runs}</span><span>${s1.balls}</span><span>${s1.fours}</span><span>${s1.sixes}</span><span>${sr1}</span></div>
<div class="row"><span class="name">${nonStriker}</span><span>${s2.runs}</span><span>${s2.balls}</span><span>${s2.fours}</span><span>${s2.sixes}</span><span>${sr2}</span></div>`;
});
}

/* ================= BOWLER ================= */
function loadBowler(bowler){
fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
if(d.status!=="ok") return;

const b=d.stats[bowler]||{overs:0,balls:0,maidens:0,runsGiven:0,wickets:0};
const overs = `${b.overs}.${b.balls}`;
const eco=b.overs? (b.runsGiven/b.overs).toFixed(2) :"0.00";

el("bowlRows").innerHTML=`
<div class="bowler-row">
<span class="name"><span class="star">*</span>${bowler}</span>
<span>${overs}</span>
<span>${b.maidens}</span>
<span>${b.runsGiven}</span>
<span>${b.wickets}</span>
<span>${eco}</span>
</div>`;
});
}

/* AUTO REFRESH */
loadLive();
setInterval(loadLive,2000);
