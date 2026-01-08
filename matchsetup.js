const API = "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

let TEAM_MAP = {};

function loadTeams(){
  fetch(API + "?action=teams")
    .then(r => r.json())
    .then(d => {

      const teamA = document.getElementById("teamA");
      const teamB = document.getElementById("teamB");

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

  const a = document.getElementById("teamA").value;
  const b = document.getElementById("teamB").value;

  const toss = document.getElementById("toss");
  const bat  = document.getElementById("batting");

  toss.innerHTML = `<option value="">Toss Winner</option>`;
  bat.innerHTML  = `<option value="">Batting First</option>`;

  if(a && b){
    toss.innerHTML += `<option value="${a}">${TEAM_MAP[a]}</option>`;
    toss.innerHTML += `<option value="${b}">${TEAM_MAP[b]}</option>`;

    bat.innerHTML  += `<option value="${a}">${TEAM_MAP[a]}</option>`;
    bat.innerHTML  += `<option value="${b}">${TEAM_MAP[b]}</option>`;
  }
}

function createMatch(){

  const teamA = document.getElementById("teamA").value;
  const teamB = document.getElementById("teamB").value;
  const overs = document.getElementById("overs").value;
  const toss  = document.getElementById("toss").value;
  const bat   = document.getElementById("batting").value;

  if(!teamA || !teamB){
    alert("Select both teams");
    return;
  }
  if(teamA === teamB){
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

  // 1️⃣ CREATE MATCH
  fetch(API,{
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body:new URLSearchParams({
      action:"createMatch",
      teamA: teamA,
      teamB: teamB,
      overs: overs
    })
  })
  .then(r => r.json())
  .then(d => {

    // 2️⃣ START MATCH (INIT LIVE_STATE)
    fetch(API,{
      method:"POST",
      headers:{ "Content-Type":"application/x-www-form-urlencoded" },
      body:new URLSearchParams({
        action:"startMatch",
        match_id: d.match_id,
        batting: bat,
        bowling: bat === teamA ? teamB : teamA,
        striker: "",        // will be selected in scoreboard
        nonStriker: "",
        bowler: ""
      })
    })
    .then(() => {
      window.location = "scoreboard.html?match_id=" + d.match_id;
    });

  })
  .catch(() => {
    alert("Error creating match");
  });
}

document.addEventListener("DOMContentLoaded", loadTeams);
