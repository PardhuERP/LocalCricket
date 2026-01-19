const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let MATCH_ID="";
let matches=[];
let actionInProgress=false;

const el=id=>document.getElementById(id);

/* LOAD MATCH LIST */
function loadMatches(){
fetch(`${API}?action=getMatches`)
.then(r=>r.json())
.then(d=>{
matches=d.matches||[];
let html='<option value="">-- Select Match --</option>';
matches.forEach(m=>{
html+=`<option value="${m.matchId}">${m.matchId} | ${m.teamAId} vs ${m.teamBId}</option>`;
});
matchSelect.innerHTML=html;
});
}

/* LOAD MATCH */
function loadSelectedMatch(){
MATCH_ID = matchSelect.value;
if(!MATCH_ID) return alert("Select match");

const match = matches.find(m=>m.matchId===MATCH_ID);
loadOpeningPlayers(match);
loadLiveScore();
}

/* LOAD OPENING PLAYERS */
function loadOpeningPlayers(match){
fetch(`${API}?action=getPlayers&teamId=${match.teamAId}`)
.then(r=>r.json())
.then(bat=>{
strikerSelect.innerHTML='<option value="">Striker</option>';
nonStrikerSelect.innerHTML='<option value="">Non-Striker</option>';
bat.players.forEach(p=>{
strikerSelect.innerHTML+=`<option value="${p.playerId}">${p.playerName}</option>`;
nonStrikerSelect.innerHTML+=`<option value="${p.playerId}">${p.playerName}</option>`;
});
});

fetch(`${API}?action=getPlayers&teamId=${match.teamBId}`)
.then(r=>r.json())
.then(bowl=>{
bowlerSelect.innerHTML='<option value="">Bowler</option>';
bowl.players.forEach(p=>{
bowlerSelect.innerHTML+=`<option value="${p.playerId}">${p.playerName}</option>`;
});
});
}

/* SET OPENING */
function setOpening(){
const striker=strikerSelect.value;
const nonStriker=nonStrikerSelect.value;
const bowler=bowlerSelect.value;

if(!striker||!nonStriker||!bowler)
return alert("Select striker, non-striker & bowler");

fetch(`${API}?action=setOpeningPlayers&matchId=${MATCH_ID}&strikerId=${striker}&nonStrikerId=${nonStriker}&bowlerId=${bowler}`)
.then(()=>alert("Opening players set ✅"));
}

/* LIVE SCORE */
function loadLiveScore(){
if(!MATCH_ID) return;

fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
el("teamScore").innerText=`${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
el("state").innerText=d.state;
});
}

/* CALL ACTION */
function call(url){
if(actionInProgress) return;
actionInProgress=true;

fetch(url)
.then(()=>setTimeout(loadLiveScore,600))
.finally(()=>setTimeout(()=>actionInProgress=false,800));
}

/* BUTTONS */
function addRun(r){ call(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`); }
function addExtra(t){ call(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`); }
function addWicket(){ call(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`); }
function addRunOut(){ call(`${API}?action=addRunOut&matchId=${MATCH_ID}`); }
function undoBall(){ call(`${API}?action=undoBall&matchId=${MATCH_ID}`); }

/* INIT */
window.onload=loadMatches;
setInterval(loadLiveScore,2000);
