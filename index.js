const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

function loadLiveScore() {
  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(res => res.json())
    .then(data => {
      if (data.status !== "ok") return;

      document.getElementById("score").innerText =
        `${data.totalRuns} / ${data.wickets}`;

      document.getElementById("overs").innerText =
        `Overs: ${data.over}.${data.ball}`;

      document.getElementById("striker").innerText = data.strikerId;
      document.getElementById("nonStriker").innerText = data.nonStrikerId;
      document.getElementById("bowler").innerText = data.bowlerId;
      document.getElementById("state").innerText = data.state;
    });
}

// auto refresh every 2 seconds
setInterval(loadLiveScore, 2000);
loadLiveScore();


function addRun(runs) {
  fetch(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${runs}`)
    .then(res => res.json())
    .then(() => loadLiveScore());
}

function addExtra(type) {
  fetch(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${type}`)
    .then(res => res.json())
    .then(() => loadLiveScore());
}

function addWicket() {
  fetch(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`)
    .then(res => res.json())
    .then(() => loadLiveScore());
}

function undoBall() {
  fetch(`${API}?action=undoBall&matchId=${MATCH_ID}`)
    .then(res => res.json())
    .then(() => loadLiveScore());
}
