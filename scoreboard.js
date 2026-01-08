const MATCH_ID = "M001";
const API = "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

function fetchLive(){
  fetch(API + "?action=live&match_id=" + MATCH_ID)
    .then(r => r.json())
    .then(updateUI);
}

function updateUI(d){
  document.getElementById("score").innerText =
    `${d.runs}/${d.wickets} (${d.over}.${d.ball})`;

  document.getElementById("striker").innerText = d.striker || "-";
  document.getElementById("nonstriker").innerText = d.non_striker || "-";
  document.getElementById("bowler").innerText = d.bowler || "-";

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

/* 🔥 IMPORTANT CHANGE HERE */
function post(data){
  fetch(API,{
    method:"POST",
    headers:{
      "Content-Type":"application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(data)
  }).then(fetchLive);
}

function sendBall(event,runs){
  post({
    action:"addBall",
    match_id:MATCH_ID,
    event:event,
    runs:runs
  });
}

function selectBatsman(pid){
  post({
    action:"selectBatsman",
    match_id:MATCH_ID,
    player:pid
  });
}

function selectBowler(pid){
  post({
    action:"selectBowler",
    match_id:MATCH_ID,
    player:pid
  });
}

setInterval(fetchLive,3000);
fetchLive();
