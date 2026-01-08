const API = "https://script.google.com/macros/s/AKfycbx1Rzd1N3KwiACih8ZBBSNvQYYW1IAt-qV9VhgvdhI9722kXH0HC3cDw9lTiktWdPKXqQ/exec";

function go(page){
  window.location = page;
}

function loadLiveMatches(){
  fetch(API + "?action=liveMatches")
    .then(r => r.json())
    .then(d => {
      let box = document.getElementById("liveMatches");
      box.innerHTML = "";

      if(!d || d.length === 0){
        box.innerHTML = "<p>No live matches</p>";
        return;
      }

      d.forEach(m => {
        box.innerHTML += `
          <div class="match">
            <b>${m.teamA} vs ${m.teamB}</b><br>
            Overs: ${m.overs}<br>
            <button class="btn" onclick="openMatch('${m.match_id}')">
              Open Scoreboard
            </button>
          </div>
        `;
      });
    })
    .catch(()=>{
      document.getElementById("liveMatches").innerHTML =
        "<p>No live matches</p>";
    });
}

function openMatch(matchId){
  window.location = "scoreboard.html?match_id=" + matchId;
}

loadLiveMatches();
