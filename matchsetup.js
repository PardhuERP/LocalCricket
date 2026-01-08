const API = "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

let TEAM_MAP = {};

/***********************
 * LOAD TEAMS
 ***********************/
function loadTeams() {
  fetch(API + "?action=teams&t=" + Date.now())
    .then(r => r.json())
    .then(d => {

      console.log("Teams API:", d); // DEBUG

      const teamA = document.getElementById("teamA");
      const teamB = document.getElementById("teamB");

      teamA.innerHTML = `<option value="">Select Team A</option>`;
      teamB.innerHTML = `<option value="">Select Team B</option>`;

      TEAM_MAP = {};

      if (!Array.isArray(d) || d.length === 0) {
        alert("No teams found");
        return;
      }

      d.forEach(t => {
        TEAM_MAP[t.id] = t.name;
        teamA.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        teamB.innerHTML += `<option value="${t.id}">${t.name}</option>`;
      });

      teamA.onchange = updateTossBat;
      teamB.onchange = updateTossBat;
    })
    .catch(err => {
      console.error(err);
      alert("Failed to load teams");
    });
}

/***********************
 * UPDATE TOSS & BATTING
 ***********************/
function updateTossBat() {
  const a = document.getElementById("teamA").value;
  const b = document.getElementById("teamB").value;

  const toss = document.getElementById("toss");
  const bat  = document.getElementById("batting");

  toss.innerHTML = `<option value="">Toss Winner</option>`;
  bat.innerHTML  = `<option value="">Batting First</option>`;

  if (a && b) {
    toss.innerHTML += `<option value="${a}">${TEAM_MAP[a]}</option>`;
    toss.innerHTML += `<option value="${b}">${TEAM_MAP[b]}</option>`;

    bat.innerHTML  += `<option value="${a}">${TEAM_MAP[a]}</option>`;
    bat.innerHTML  += `<option value="${b}">${TEAM_MAP[b]}</option>`;
  }
}

/***********************
 * CREATE MATCH
 ***********************/
function createMatch() {

  const teamA = document.getElementById("teamA").value;
  const teamB = document.getElementById("teamB").value;
  const overs = document.getElementById("overs").value;
  const toss  = document.getElementById("toss").value;
  const bat   = document.getElementById("batting").value;

  if (!teamA || !teamB) {
    alert("Select both teams");
    return;
  }
  if (teamA === teamB) {
    alert("Teams must be different");
    return;
  }
  if (!overs || overs <= 0) {
    alert("Enter valid overs");
    return;
  }
  if (!toss || !bat) {
    alert("Select toss & batting");
    return;
  }

  fetch(
    API +
    "?action=createMatch" +
    "&teamA=" + teamA +
    "&teamB=" + teamB +
    "&overs=" + overs +
    "&t=" + Date.now()
  )
  .then(r => r.json())
  .then(d => {
    if (!d.match_id) {
      alert("Match ID missing");
      return;
    }

    window.location =
      "scoreboard.html" +
      "?match_id=" + d.match_id +
      "&teamA=" + teamA +
      "&teamB=" + teamB +
      "&batting=" + bat;
  })
  .catch(err => {
    console.error(err);
    alert("Error creating match");
  });
}

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", loadTeams);
