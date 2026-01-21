const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let TEAM_ID = "";
let MATCH_ID = "";

const el = id => document.getElementById(id);

/* --------------------
LOAD TEAMS
-------------------- */
fetch(`${API}?action=getTeams`)
.then(r=>r.json())
.then(d=>{
  let html='<option value="">-- Select Team --</option>';
  (d.teams||[]).forEach(t=>{
    html+=`<option value="${t.teamId}">${t.teamName}</option>`;
  });
  el("teamSelect").innerHTML=html;
});

/* --------------------
ON TEAM CHANGE → LOAD MATCHES
-------------------- */
el("teamSelect").onchange=()=>{
  TEAM_ID = el("teamSelect").value;
  if(!TEAM_ID) return;

  fetch(`${API}?action=getMatches&teamId=${TEAM_ID}`)
  .then(r=>r.json())
  .then(d=>{
    let html='<option value="">-- Select Match --</option>';
    (d.matches||[]).forEach(m=>{
      html+=`<option value="${m.matchId}">${m.teamAId} vs ${m.teamBId}</option>`;
    });
    el("matchSelect").innerHTML=html;
  });
};

/* --------------------
ON MATCH SELECT
-------------------- */
el("matchSelect").onchange=()=>{
  MATCH_ID = el("matchSelect").value;
  if(!MATCH_ID) return;

  loadMatchStatus();
};

/* --------------------
LOAD MATCH STATUS
-------------------- */
function loadMatchStatus(){
fetch(`${API}?action=getMatch&matchId=${MATCH_ID}`)
.then(r=>r.json())
.then(m=>{
  el("matchInfo").innerHTML = `
    <b>${m.teamAId}</b> vs <b>${m.teamBId}</b><br>
    Overs: ${m.overs}<br>
    Toss: ${m.tossWinner || "Not Done"}<br>
    Batting First: ${m.battingFirst || "-"}<br>
    Status: ${m.matchStatus}
  `;
  updateButtons(m);
});
}

/* --------------------
BUTTON VISIBILITY LOGIC
-------------------- */
function updateButtons(m){
  hideAll();

  if(!m.tossWinner){
    show("btnToss");
    return;
  }

  if(!m.playing11Done){
    show("btnPlaying11");
    return;
  }

  if(!m.openersSet){
    show("btnOpeners");
    return;
  }

  if(m.matchStatus==="SCHEDULED"){
    show("btnStart1");
  }

  if(m.matchStatus==="LIVE"){
    show("btnLive");
    show("btnEnd1");
  }

  if(m.matchStatus==="INNINGS_BREAK"){
    show("btnStart2");
  }

  if(m.matchStatus==="COMPLETED"){
    show("btnSummary");
  }
}

function hideAll(){
  document.querySelectorAll("button").forEach(b=>b.classList.add("hidden"));
}
function show(id){ el(id).classList.remove("hidden"); }

/* --------------------
NAVIGATION
-------------------- */
el("btnToss").onclick=()=>go("toss.html");
el("btnPlaying11").onclick=()=>go("playing11.html");
el("btnOpeners").onclick=()=>go("openers.html");
el("btnLive").onclick=()=>go("live.html");
el("btnSummary").onclick=()=>go("matchsummary.html");

el("btnStart1").onclick=()=>{
  if(confirm("Start 1st innings?")){
    fetch(`${API}?action=startFirstInnings&matchId=${MATCH_ID}`)
    .then(()=>loadMatchStatus());
  }
};

el("btnEnd1").onclick=()=>{
  if(confirm("End 1st innings?")){
    fetch(`${API}?action=endInnings&matchId=${MATCH_ID}`)
    .then(()=>loadMatchStatus());
  }
};

el("btnStart2").onclick=()=>{
  if(confirm("Start 2nd innings?")){
    fetch(`${API}?action=startSecondInnings&matchId=${MATCH_ID}`)
    .then(()=>loadMatchStatus());
  }
};

function go(page){
  window.location = `${page}?teamId=${TEAM_ID}&matchId=${MATCH_ID}`;
}
