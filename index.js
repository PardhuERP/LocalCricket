const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let MATCH_ID="";
let actionInProgress=false;

const el=id=>document.getElementById(id);

/* LOAD MATCH LIST */
function loadMatches(){
fetch(`${API}?action=getMatches`)
.then(r=>r.json())
.then(d=>{
let html='<option value="">-- Select Match --</option>';
(d.matches||[]).forEach(m=>{
html+=`<option value="${m.matchId}">${m.matchId} | ${m.teamAId} vs ${m.teamBId}</option>`;
});
matchSelect.innerHTML=html;
});
}

/* LOAD MATCH */
function loadSelectedMatch(){
MATCH_ID=matchSelect.value;
if(!MATCH_ID) return alert("Select match");
loadLiveScore();
}

/* LIVE STATE */
function loadLiveScore(){
if(!MATCH_ID) return;

fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(d=>{
if(d.status!=="ok") return;

el("teamScore").innerText=`${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
el("state").innerText=d.state;
});
}

/* ACTION CALL */
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
function undoBall(){ call(`${API}?action=undoBall&matchId=${MATCH_ID}`); }

/* INIT */
window.onload=loadMatches;
setInterval(loadLiveScore,2000);
