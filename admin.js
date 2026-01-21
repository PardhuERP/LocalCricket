const API="https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";
let MATCH_ID="";

/* Load matches */
fetch(`${API}?action=getMatches`)
.then(r=>r.json())
.then(d=>{
  let html='<option value="">-- Select Match --</option>';
  (d.matches||[]).forEach(m=>{
    html+=`<option value="${m.matchId}">${m.matchId}</option>`;
  });
  matchSelect.innerHTML=html;
});

/* Load selected match */
function loadMatch(){
  MATCH_ID=matchSelect.value;
  if(!MATCH_ID) return alert("Select match");

  fetch(`${API}?action=getMatch&matchId=${MATCH_ID}`)
  .then(r=>r.json())
  .then(m=>{
    if(m.status!=="ok"){
      matchInfo.innerHTML="Match not found";
      return;
    }
    matchInfo.innerHTML=`
      <b>${m.teamAId}</b> vs <b>${m.teamBId}</b><br>
      Overs: ${m.overs}<br>
      Venue: ${m.venue}<br>
      Status: ${m.matchStatus}
    `;
  });
}

/* Live preview */
function loadLive(){
  if(!MATCH_ID) return;

  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
  .then(r=>r.json())
  .then(d=>{
    if(d.status!=="ok"){
      liveBox.innerText="Live state not started";
      return;
    }
    liveBox.innerHTML=`
      Score : ${d.totalRuns}-${d.wickets}<br>
      Over : ${d.over}.${d.ball}<br>
      Striker : ${d.strikerId || "-"}<br>
      Bowler : ${d.bowlerId || "-"}<br>
      State : ${d.state}
    `;
  });
}
setInterval(loadLive,2000);

/* Navigation */
function go(page){
  if(!MATCH_ID) return alert("Load match first");
  window.location = page + `?matchId=${MATCH_ID}`;
}

/* Match controls */
function startInnings(){
  fetch(`${API}?action=startFirstInnings&matchId=${MATCH_ID}`)
  .then(r=>r.json())
  .then(d=>alert(JSON.stringify(d)));
}
function endInnings(){
  fetch(`${API}?action=endInnings&matchId=${MATCH_ID}`)
  .then(()=>alert("Innings ended"));
}
function startSecond(){
  fetch(`${API}?action=startSecondInnings&matchId=${MATCH_ID}`)
  .then(()=>alert("2nd innings started"));
}
