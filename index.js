const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";
const MATCH_ID="MATCH_1768804773924";

const el=id=>document.getElementById(id);

/* LIVE LOAD */
function loadLive(){
fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
if(d.status!=="ok") return;

el("teamName").innerText=d.battingTeamName;
el("teamScore").innerText=`${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;

const balls=d.over*6+d.ball;
const crr=balls?(d.totalRuns/(balls/6)).toFixed(2):"0.00";
el("crr").innerText=`CRR ${crr}`;
el("pship").innerText=`P'SHIP ${d.partnershipRuns||0}(${d.partnershipBalls||0})`;

loadBatters(d.strikerId,d.nonStrikerId);
loadBowler(d.bowlerId);
});
}

/* BATTERS */
function loadBatters(s,n){
fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
const a=d.stats[s]||{runs:0,balls:0,fours:0,sixes:0};
const b=d.stats[n]||{runs:0,balls:0,fours:0,sixes:0};

const sr1=a.balls?((a.runs/a.balls)*100).toFixed(2):"0.00";
const sr2=b.balls?((b.runs/b.balls)*100).toFixed(2):"0.00";

el("batRows").innerHTML=`
<div class="row"><span class="name">*</span><span>${a.runs}</span><span>${a.balls}</span><span>${a.fours}</span><span>${a.sixes}</span><span>${sr1}</span></div>
<div class="row"><span>${n}</span><span>${b.runs}</span><span>${b.balls}</span><span>${b.fours}</span><span>${b.sixes}</span><span>${sr2}</span></div>`;
});
}

/* BOWLER */
function loadBowler(id){
fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
const b=d.stats[id]||{overs:0,balls:0,maidens:0,runsGiven:0,wickets:0};
const eco=b.overs?(b.runsGiven/b.overs).toFixed(2):"0.00";

el("bowlRows").innerHTML=`
<div class="row"><span class="name">*</span><span>${b.overs}.${b.balls||0}</span><span>${b.maidens}</span><span>${b.runsGiven}</span><span>${b.wickets}</span><span>${eco}</span></div>`;
});
}

/* ACTIONS */
const call=a=>fetch(`${API}?action=${a}`);
function addRun(r){call(`addRun&matchId=${MATCH_ID}&runs=${r}`).then(loadLive);}
function addExtra(t){call(`addExtra&matchId=${MATCH_ID}&type=${t}`).then(loadLive);}
function addWicket(){call(`addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`).then(loadLive);}
function undoBall(){call(`undoBall&matchId=${MATCH_ID}`).then(loadLive);}

/* MIC */
function startMic(){
const rec=new(window.SpeechRecognition||window.webkitSpeechRecognition)();
rec.lang="en-IN";
rec.start();
rec.onresult=e=>{
const t=e.results[0][0].transcript.toLowerCase();
if(t.includes("four")) addRun(4);
if(t.includes("six")) addRun(6);
if(t.includes("one")) addRun(1);
if(t.includes("out")) addWicket();
};
}

loadLive();
setInterval(loadLive,2000);
