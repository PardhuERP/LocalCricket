const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";
const MATCH_ID=new URLSearchParams(window.location.search).get("matchId");

const el=id=>document.getElementById(id);

let popupMode="";
let popupActive=false;

/* LOAD LIVE */
async function loadLive(){
const d=await fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`).then(r=>r.json());
if(d.status!=="ok") return;

const tn=await fetch(`${API}?action=getTeamName&teamId=${d.battingTeamId}`).then(r=>r.json());
el("teamName").innerText=tn.name;
el("teamScore").innerText=`${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;

const balls=d.over*6+d.ball;
el("crr").innerText=`CRR ${(balls?(d.totalRuns/(balls/6)):0).toFixed(2)}`;
el("pship").innerText=`P'SHIP ${d.partnershipRuns||0}(${d.partnershipBalls||0})`;

loadBatters(d.strikerId,d.nonStrikerId);
loadBowler(d.bowlerId);

handleState(d);
}

/* BATTERS */
async function loadBatters(s,n){
const stats=await fetch(`${API}?action=getBatsmanStats&matchId=${MATCH_ID}`).then(r=>r.json());
const a=stats.stats[s]||{runs:0,balls:0,fours:0,sixes:0};
const b=stats.stats[n]||{runs:0,balls:0,fours:0,sixes:0};

const [sn,nn]=await Promise.all([
fetch(`${API}?action=getPlayerName&playerId=${s}`).then(r=>r.json()),
fetch(`${API}?action=getPlayerName&playerId=${n}`).then(r=>r.json())
]);

const sr1=a.balls?((a.runs/a.balls)*100).toFixed(2):"0.00";
const sr2=b.balls?((b.runs/b.balls)*100).toFixed(2):"0.00";

el("batRows").innerHTML=`
<div class="table-row"><span class="name star">* ${sn.name}</span><span>${a.runs}</span><span>${a.balls}</span><span>${a.fours}</span><span>${a.sixes}</span><span>${sr1}</span></div>
<div class="table-row"><span>${nn.name}</span><span>${b.runs}</span><span>${b.balls}</span><span>${b.fours}</span><span>${b.sixes}</span><span>${sr2}</span></div>`;
}

/* BOWLER */
async function loadBowler(id){
if(!id) return;
const [d,n]=await Promise.all([
fetch(`${API}?action=getPlayerMatchStats&matchId=${MATCH_ID}`).then(r=>r.json()),
fetch(`${API}?action=getPlayerName&playerId=${id}`).then(r=>r.json())
]);

const b=d.stats[id]||{overs:0,balls:0,maidens:0,runsGiven:0,wickets:0};
el("bowlRows").innerHTML=`
<div class="table-row"><span class="name star">* ${n.name}</span><span>${b.overs}.${b.balls||0}</span><span>${b.maidens}</span><span>${b.runsGiven}</span><span>${b.wickets}</span><span>${b.overs?(b.runsGiven/b.overs).toFixed(2):"0.00"}</span></div>`;
}

/* POPUP PLAYING11 BATSMEN */
async function loadRemainingBatters(){
const p11=await fetch(`${API}?action=getPlaying11&matchId=${MATCH_ID}`).then(r=>r.json());
return p11.players||[];
}

async function openPopup(mode,title){
popupMode=mode;
popupActive=true;
el("popupTitle").innerText=title;

const list=await loadRemainingBatters();
let html='<option value="">-- Select --</option>';
list.forEach(p=> html+=`<option value="${p.playerId}">${p.playerName}</option>`);
el("popupSelect").innerHTML=html;

el("popup").classList.remove("hidden");
}

function confirmPopup(){
const id=el("popupSelect").value;
if(!id) return alert("Select player");

if(popupMode==="BATSMAN"){
fetch(`${API}?action=setNewBatsman&matchId=${MATCH_ID}&newBatsmanId=${id}`).then(loadLive);
}
if(popupMode==="BOWLER"){
fetch(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${id}`).then(loadLive);
}
popupActive=false;
el("popup").classList.add("hidden");
}

/* STATE */
function handleState(d){
if(popupActive) return;

if(d.state==="WICKET") openPopup("BATSMAN","Select New Batsman");
if(d.state==="OVER_END") openPopup("BOWLER","Select New Bowler");
}

/* ACTIONS */
const hit=a=>fetch(`${API}?action=${a}&matchId=${MATCH_ID}`).then(loadLive);
function addRun(r){hit(`addRun&runs=${r}`);}
function addExtra(t){hit(`addExtra&type=${t}`);}
function addWicket(){hit(`addWicket&wicketType=BOWLED`);}
function runOut(){hit(`addRunOut&out=STRIKER`);}
function undoBall(){hit("undoBall");}

loadLive();
setInterval(loadLive,2000);
