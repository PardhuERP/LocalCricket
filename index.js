const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";
const MATCH_ID="MATCH_1768804773924";

const el=id=>document.getElementById(id);

/* GLOBALS */
let popupActive=false;
let popupMode=null;
let lastHandledEvent=null;
let wicketOverStep=null;
let CURRENT_BATTING_TEAM="";
let CURRENT_BOWLING_TEAM="";

/* ================= LIVE ================= */
async function loadLive(){
const r=await fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`);
const d=await r.json();
if(d.status!=="ok") return;

CURRENT_BATTING_TEAM=d.battingTeamId;
CURRENT_BOWLING_TEAM=d.bowlingTeamId;

const over=Number(d.over)||0;
const ball=Number(d.ball)||0;

const tn = await fetch(`${API}?action=getTeamName&teamId=${CURRENT_BATTING_TEAM}`).then(r=>r.json());

el("teamName").innerText=tn.name;
el("teamScore").innerText=`${d.totalRuns}-${d.wickets} (${over}.${ball})`;

const balls=over*6+ball;
const crr=balls?(d.totalRuns/(balls/6)).toFixed(2):"0.00";
el("crr").innerText=`CRR ${crr}`;
el("pship").innerText=`P'SHIP ${d.partnershipRuns||0}(${d.partnershipBalls||0})`;

loadBatters(d.strikerId,d.nonStrikerId);
loadBowler(d.bowlerId);

handleStateUI(d);
}

/* ================= PLAYER NAME ================= */
async function getName(id){
if(!id) return "";
const r=await fetch(`${API}?action=getPlayerName&playerId=${id}`);
const d=await r.json();
return d.name||id;
}

/* ================= BATTERS ================= */
async function loadBatters(s,n){
const r=await fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`);
const d=await r.json();

const a=d.stats[s]||{runs:0,balls:0,fours:0,sixes:0};
const b=d.stats[n]||{runs:0,balls:0,fours:0,sixes:0};

const sr1=a.balls?((a.runs/a.balls)*100).toFixed(2):"0.00";
const sr2=b.balls?((b.runs/b.balls)*100).toFixed(2):"0.00";

const sn=await getName(s);
const nn=await getName(n);

el("batRows").innerHTML=`
<div class="row"><span class="name star">* ${sn}</span><span>${a.runs}</span><span>${a.balls}</span><span>${a.fours}</span><span>${a.sixes}</span><span>${sr1}</span></div>
<div class="row"><span>${nn}</span><span>${b.runs}</span><span>${b.balls}</span><span>${b.fours}</span><span>${b.sixes}</span><span>${sr2}</span></div>`;
}

/* ================= BOWLER ================= */
async function loadBowler(id){
if(!id){ el("bowlRows").innerHTML=""; return; }

const [sr,name]=await Promise.all([
fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`).then(r=>r.json()),
getName(id)
]);

const b=sr.stats[id]||{overs:0,balls:0,maidens:0,runsGiven:0,wickets:0};

const overs=`${b.overs}.${b.balls||0}`;
const eco=b.overs?(b.runsGiven/b.overs).toFixed(2):"0.00";

el("bowlRows").innerHTML=`
<div class="row">
<span class="name star">* ${name}</span>
<span>${overs}</span>
<span>${b.maidens}</span>
<span>${b.runsGiven}</span>
<span>${b.wickets}</span>
<span>${eco}</span>
</div>`;
}

/* ================= STATE CONTROLLER ================= */
function handleStateUI(d){
if(popupActive) return;

if(d.state==="NORMAL"){ lastHandledEvent=null; wicketOverStep=null; return; }

if(d.state==="WICKET" && lastHandledEvent!==`WICKET_${d.wickets}`){
lastHandledEvent=`WICKET_${d.wickets}`;
openPopup("BATSMAN","Select New Batsman");
return;
}

if(d.state==="WICKET_OVER_END"){
if(!wicketOverStep){
wicketOverStep="BAT_DONE";
openPopup("BATSMAN","Select New Batsman");
}else if(wicketOverStep==="BAT_CONF" && lastHandledEvent!==`OVER_END_${d.over}`){
lastHandledEvent=`OVER_END_${d.over}`;
openPopup("BOWLER","Select New Bowler");
}
return;
}

if(d.state==="OVER_END" && lastHandledEvent!==`OVER_END_${d.over}`){
lastHandledEvent=`OVER_END_${d.over}`;
openPopup("BOWLER","Select New Bowler");
}
}

/* ================= POPUP ================= */
function openPopup(mode,title){
popupMode=mode;
popupActive=true;
el("popupTitle").innerText=title;

const team = mode==="BOWLER" ? CURRENT_BOWLING_TEAM : CURRENT_BATTING_TEAM;

fetch(`${API}?action=getPlaying11&matchId=${MATCH_ID}&teamId=${team}`)
.then(r=>r.json())
.then(d=>{
let html='<option value="">-- Select Player --</option>';
(d.players||[]).forEach(p=> html+=`<option value="${p.playerId}">${p.playerName}</option>`);
el("popupSelect").innerHTML=html;
document.getElementById("popup").classList.remove("hidden");
});
}

function confirmPopup(){
const v=el("popupSelect").value;
if(!v) return alert("Select player");

if(popupMode==="BATSMAN"){ wicketOverStep="BAT_CONF"; fetch(`${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${v}`); }
if(popupMode==="BOWLER"){ fetch(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`); }

closePopup();
setTimeout(loadLive,500);
}

function closePopup(){
popupActive=false;
popupMode=null;
document.getElementById("popup").classList.add("hidden");
}

/* ================= ACTIONS ================= */
const call=url=>fetch(url).then(()=>setTimeout(loadLive,300));

function addRun(r){call(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`);}
function addExtra(t){call(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`);}
function addWicket(){call(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`);}
function undoBall(){call(`${API}?action=undoBall&matchId=${MATCH_ID}`);}

/* ================= MIC ================= */
function startMic(){
const rec=new(window.SpeechRecognition||window.webkitSpeechRecognition)();
rec.lang="en-IN";
rec.start();
rec.onresult=e=>{
const t=e.results[0][0].transcript.toLowerCase();
if(t.includes("four")) addRun(4);
else if(t.includes("six")) addRun(6);
else if(t.includes("one")) addRun(1);
else if(t.includes("out")) addWicket();
};
}

loadLive();
setInterval(loadLive,2000);
