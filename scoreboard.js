const MATCH_ID = "M001";
const API = "https://https://script.google.com/macros/s/NEW_EXEC_ID/exec";

function fetchLive(){
  fetch(API + "?action=live&match_id=" + MATCH_ID)
    .then(r => r.json())
    .then(updateUI);
}

function updateUI(d){
  document.getElementById("score").innerText =
    `${d.runs}/${d.wickets} (${d.over}.${d.ball})`;

  document.getElementById("striker").innerText = d.striker;
  document.getElementById("nonstriker").innerText = d.non_striker;
  document.getElementById("bowler").innerText = d.bowler;

  document.getElementById("runButtons").classList.toggle(
    "hidden", d.waiting_for !== "NONE"
  );
  document.getElementById("batsmanBox").classList.toggle(
    "hidden", d.waiting_for !== "BATSMAN"
  );
  document.getElementById("bowlerBox").classList.toggle(
    "hidden", d.waiting_for !== "BOWLER"
  );
}
function sendBall(event,runs){
  fetch(API,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      action:"addBall",
      match_id:MATCH_ID,
      event:event,
      runs:runs
    })
  }).then(fetchLive);
}

function selectBatsman(pid){
  fetch(API,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      action:"selectBatsman",
      match_id:MATCH_ID,
      player:pid
    })
  }).then(fetchLive);
}

function selectBowler(pid){
  fetch(API,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      action:"selectBowler",
      match_id:MATCH_ID,
      player:pid
    })
  }).then(fetchLive);
}
