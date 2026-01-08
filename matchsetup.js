const API = "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

console.log("matchsetup.js loaded"); // DEBUG

function loadTeams(){
  fetch(API + "?action=teams")
    .then(r => r.json())
    .then(d => {
      let a = document.getElementById("teamA");
      let b = document.getElementById("teamB");
      let toss = document.getElementById("toss");
      let bat = document.getElementById("batting");

      a.innerHTML = `<option value="">Select Team A</option>`;
      b.innerHTML = `<option value="">Select Team B</option>`;

      d.forEach(t => {
        a.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        b.innerHTML += `<option value="${t.id}">${t.name}</option>`;
      });

      a.onchange = updateTossBat;
      b.onchange = updateTossBat;
    });
}

function updateTossBat(){
  let a = document.getElementById("teamA").value;
  let b = document.getElementById("teamB").value;

  let toss = document.getElementById("toss");
  let bat  = document.getElementById("batting");

  toss.innerHTML = `<option value="">Toss Winner</option>`;
  bat.innerHTML  = `<option value="">Batting First</option>`;

  if(a) toss.innerHTML += `<option value="${a}">Team A</option>`;
  if(b) toss.innerHTML += `<option value="${b}">Team B</option>`;
  if(a) bat.innerHTML  += `<option value="${a}">Team A</option>`;
  if(b) bat.innerHTML  += `<option value="${b}">Team B</option>`;
}

function createMatch(){
  console.log("Start Match clicked"); // DEBUG

  let a = document.getElementById("teamA").value;
  let b = document.getElementById("teamB").value;
  let o = document.getElementById("overs").value;
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
  if(!o || o <= 0){
    alert("Enter valid overs");
    return;
  }
  if(!toss || !bat){
    alert("Select toss & batting");
    return;
  }

  fetch(API,{
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body:new URLSearchParams({
      action:"createMatch",
      teamA: a,
      teamB: b,
      overs: o
    })
  })
  .then(r => r.json())
  .then(d => {
    console.log("Match created", d);
    alert("Match Created: " + d.match_id);
    window.location = "scoreboard.html?match_id=" + d.match_id;
  })
  .catch(err => {
    console.error(err);
    alert("Error creating match");
  });
}

// AUTO LOAD
document.addEventListener("DOMContentLoaded", loadTeams);
