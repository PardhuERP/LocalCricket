const API = "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

const qs = new URLSearchParams(window.location.search);
const MATCH_ID = qs.get("match_id");
const battingTeam = qs.get("batting");
const teamA = qs.get("teamA");
const teamB = qs.get("teamB");

if (!MATCH_ID) {
  alert("Match ID missing. Please start match from Match Setup.");
  throw new Error("MATCH_ID is null");
}

let actionLock = false; // 🔒 double-tap protection

/***********************
 * HELPERS
 ***********************/
function bowlingTeam(){
  return battingTeam === teamA ? teamB : teamA;
}

/***********************
 * LOAD PLAYERS
 ***********************/
function loadPlayers(){

  // Batting team players
  fetch(API + "?action=players&team_id=" + battingTeam)
    .then(r => r.json())
    .then(d => {
      const s = document.getElementById("striker");
      const ns = document.getElementById("nonStriker");

      s.innerHTML = `<option value="">Select Striker</option>`;
      ns.innerHTML = `<option value="">Select Non-Striker</option>`;

      d.forEach(p => {
        s.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        ns.innerHTML += `<option value="${p.id}">${p.name}</option>`;
      });
    });

  // Bowling team players
  fetch(API + "?action=players&team_id=" + bowlingTeam())
    .then(r => r.json())
    .then(d => {
      const b = document.getElementById("bowler");
      b.innerHTML = `<option value="">Select Bowler</option>`;
      d.forEach(p => {
        b.innerHTML += `<option value="${p.id}">${p.name}</option>`;
      });
    });
}

/***********************
 * FETCH LIVE STATE
 ***********************/
function fetchLive(){
  fetch(API + "?action=live&match_id=" + MATCH_ID)
    .then(r => r.json())
    .then(updateUI)
    .catch(err => console.error("Live fetch failed", err));
}

/***********************
 * UPDATE UI
 ***********************/
function updateUI(d){

  // Match not started yet
  if (!d || d.over === undefined) {
    document.getElementById("startMatchBox").style.display = "block";
    document.getElementById("scoringBox").style.display = "none";
    return;
  }

  document.getElementById("startMatchBox").style.display = "none";
  document.getElementById("scoringBox").style.display = "block";

  document.getElementById("score").innerText =
    `${d.runs}/${d.wickets} (${d.over}.${d.ball})`;

  document.getElementById("sName").innerText = d.striker || "-";
  document.getElementById("nsName").innerText = d.non_striker || "-";
  document.getElementById("bName").innerText = d.bowler || "-";

  document.getElementById("runButtons").classList.toggle(
    "hidden", d.waiting_for !== "NONE"
  );
}

/***********************
 * SAFE GET (ANTI DOUBLE TAP)
 ***********************/
function safeGet(url){
  if (actionLock) return;
  actionLock = true;

  fetch(url)
    .then(() => fetchLive())
    .catch(err => {
      console.error("API error", err);
      alert("Network error");
    })
    .finally(() => {
      setTimeout(() => actionLock = false, 600);
    });
}

/***********************
 * START MATCH
 ***********************/
function startMatch(){

  const striker = document.getElementById("striker").value;
  const nonStriker = document.getElementById("nonStriker").value;
  const bowler = document.getElementById("bowler").value;

  if (!striker || !nonStriker || !bowler) {
    alert("Select Striker, Non-Striker and Bowler");
    return;
  }

  safeGet(
    API +
    "?action=startMatch" +
    "&match_id=" + MATCH_ID +
    "&batting=" + battingTeam +
    "&bowling=" + bowlingTeam() +
    "&striker=" + striker +
    "&nonStriker=" + nonStriker +
    "&bowler=" + bowler
  );
}

/***********************
 * SCORING
 ***********************/
function ball(runs){
  safeGet(
    API +
    "?action=addBall" +
    "&match_id=" + MATCH_ID +
    "&event=RUN" +
    "&runs=" + runs
  );
}

function extra(type){
  safeGet(
    API +
    "?action=addBall" +
    "&match_id=" + MATCH_ID +
    "&event=" + type +
    "&runs=0"
  );
}

function wicket(){
  safeGet(
    API +
    "?action=addBall" +
    "&match_id=" + MATCH_ID +
    "&event=WICKET" +
    "&runs=0"
  );
}

function undo(){
  safeGet(
    API +
    "?action=undoBall" +
    "&match_id=" + MATCH_ID
  );
}

/***********************
 * INIT
 ***********************/
loadPlayers();
fetchLive();
setInterval(fetchLive, 3000);
