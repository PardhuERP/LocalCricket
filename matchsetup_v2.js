const API =
  "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

let TEAM_MAP = {};

/***********************
 * LOAD TEAMS
 ***********************/
function loadTeams() {

  fetch(API + "?action=teams&t=" + Date.now())
    .then(r => r.json())
    .then(teams => {

      console.log("Teams API:", teams.length);

      const teamA = document.getElementById("teamA");
      const teamB = document.getElementById("teamB");

      teamA.innerHTML = `<option value="">Select Team A</option>`;
      teamB.innerHTML = `<option value="">Select Team B</option>`;

      TEAM_MAP = {};

      if (!Array.isArray(teams) || teams.length === 0) {
        alert("No teams available");
        return;
      }

      teams.forEach(t => {
        TEAM_MAP[t.id] = t.name;
        teamA.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        teamB.innerHTML += `<option value="${t.id}">${t.name}</option>`;
      });

      teamA.addEventListener("change", updateTossBat);
      teamB.addEventListener("change", updateTossBat);
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

  const teamA = document.getElementById("teamA").value;
  const teamB = document.getElementById("teamB").value;

  const toss = document.getElementById("toss");
  const batting = document.getElementById("batting");

  toss.innerHTML = `<option value="">Toss Winner</option>`;
  batting.innerHTML = `<option value="">Batting First</option>`;

  if (teamA && teamB) {
    toss.innerHTML += `<option value="${teamA}">${TEAM_MAP[teamA]}</option>`;
    toss.innerHTML += `<option value="${teamB}">${TEAM_MAP[teamB]}</option>`;

    batting.innerHTML += `<option value="${teamA}">${TEAM_MAP[teamA]}</option>`;
    batting.innerHTML += `<option value="${teamB}">${TEAM_MAP[teamB]}</option>`;
  }
}

/***********************
 * CREATE MATCH (GET)
 ***********************/
function createMatch() {

  const teamA = document.getElementById("teamA").value;
  const teamB = document.getElementById("teamB").value;
  const overs = document.getElementById("overs").value;
  const toss = document.getElementById("toss").value;
  const batting = document.getElementById("batting").value;

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
  if (!toss || !batting) {
    alert("Select toss winner and batting first");
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
    .then(res => {

      if (!res.match_id) {
        alert("Match creation failed");
        return;
      }

      window.location =
        "scoreboard.html" +
        "?match_id=" + res.match_id +
        "&teamA=" + teamA +
        "&teamB=" + teamB +
        "&batting=" + batting;
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
