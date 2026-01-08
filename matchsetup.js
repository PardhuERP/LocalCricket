const API = "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

let TEAM_MAP = {};

function loadTeams(){
  fetch(API + "?action=teams")
    .then(r => r.json())
    .then(d => {

      let teamA = document.getElementById("teamA");
      let teamB = document.getElementById("teamB");

      teamA.innerHTML = `<option value="">Select Team A</option>`;
      teamB.innerHTML = `<option value="">Select Team B</option>`;

      TEAM_MAP = {};

      d.forEach(t => {
        TEAM_MAP[t.id] = t.name;
        teamA.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        teamB.innerHTML += `<option value="${t.id}">${t.name}</option>`;
      });

      teamA.onchange = updateTossBat;
      teamB.onchange = updateTossBat;
    });
}

function updateTossBat(){

  let a = document.getElementById("teamA").value;
  let b = document.getElementById("teamB").value;

  let toss = document.getElementById("toss");
  let bat  = document.getElementById("batting");

  toss.innerHTML = `<option value="">Toss Winner</option>`;
  bat.innerHTML  = `<option value="">Batting First</option>`;

  // Show options ONLY when both teams selected
  if(a && b){
    toss.innerHTML += `<option value="${a}">${TEAM_MAP[a]}</option>`;
    toss.innerHTML += `<option value="${b}">${TEAM_MAP[b]}</option>`;

    bat.innerHTML  += `<option value="${a}">${TEAM_MAP[a]}</option>`;
    bat.innerHTML  += `<option value="${b}">${TEAM_MAP[b]}</option>`;
  }
}

function createMatch(){

  let a = document.getElementById("teamA").value;
  let b = document.getElementById("teamB").value;
  let overs = document.getElementById("overs").value;
  let toss = document.getElementById("toss").value;
  let bat  = document.getElementById("batting").value;

  if(!a || !b){
    alert("Select both teams");
    return;
  }
  if(a === b){
    alert("Team A and Team B must be different");
    return;
  }
  if(!overs || overs <= 0){
    alert("Enter valid overs");
    return;
  }
  if(!toss || !bat){
    alert("Select toss winner and batting first");
    return;
  }

  fetch(API,{
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body:new URLSearchParams({
      action:"createMatch",
      teamA: a,
      teamB: b,
      overs: overs
    })
  })
  .then(r => r.json())
  .then(d => {
    alert("Match Created");
    window.location = "scoreboard.html?match_id=" + d.match_id;
  })
  .catch(() => {
    alert("Error creating match");
  });
}

document.addEventListener("DOMContentLoaded", loadTeams);
