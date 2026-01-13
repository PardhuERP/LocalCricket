const API =
  "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

/* =========================
   LOAD TEAMS
========================= */
function loadTeams() {
  fetch(API + "?action=getTeams")
    .then(r => r.json())
    .then(d => {
      const sel = document.getElementById("teamSelect");
      d.teams.forEach(t => {
        const op = document.createElement("option");
        op.value = t.teamId;
        op.textContent = `${t.teamName} (${t.shortName})`;
        sel.appendChild(op);
      });
    });
}

/* =========================
   GENERATE PLAYER ID
========================= */
function generatePlayerId(teamId) {
  const key = "PLAYER_SEQ_" + teamId;
  let n = Number(localStorage.getItem(key) || 0) + 1;
  localStorage.setItem(key, n);
  return `${teamId}_P${String(n).padStart(2, "0")}`;
}

/* =========================
   ADD PLAYER
========================= */
function addPlayer() {
  const teamId = teamSelect.value;
  const playerName = playerNameInput.value.trim();
  const jerseyNo = jerseyNoInput.value || "";
  const role = roleSelect.value;
  const batting = battingStyleSelect.value;
  const bowling = bowlingStyleSelect.value;

  if (!teamId || !playerName || !role || !batting || !bowling) {
    alert("Please fill all mandatory fields (*)");
    return;
  }

  const playerId = generatePlayerId(teamId);

  const url =
    API +
    `?action=addPlayer` +
    `&playerId=${playerId}` +
    `&teamId=${teamId}` +
    `&playerName=${encodeURIComponent(playerName)}` +
    `&jerseyNo=${jerseyNo}` +
    `&role=${role}` +
    `&battingStyle=${encodeURIComponent(batting)}` +
    `&bowlingStyle=${encodeURIComponent(bowling)}` +
    `&isActive=TRUE`;

  fetch(url)
    .then(r => r.json())
    .then(d => {
      if (d.status === "ok") {
        alert("Player Added: " + playerId);
        clearForm();
        loadPlayers();
      } else {
        alert(d.message);
      }
    });
}

/* =========================
   LOAD PLAYERS
========================= */
function loadPlayers() {
  fetch(API + "?action=getPlayers")
    .then(r => r.json())
    .then(d => {
      const box = document.getElementById("playerList");
      box.innerHTML = "";
      d.players.forEach(p => {
        box.innerHTML += `
          <div class="player">
            <b>${p.playerName}</b> (${p.playerId})<br>
            ${p.role} | ${p.battingStyle} | ${p.bowlingStyle}
          </div>`;
      });
    });
}

function clearForm() {
  playerNameInput.value = "";
  jerseyNoInput.value = "";
  roleSelect.value = "";
  battingStyleSelect.value = "";
  bowlingStyleSelect.value = "";
}

/* =========================
   INIT
========================= */
const teamSelect = document.getElementById("teamSelect");
const playerNameInput = document.getElementById("playerName");
const jerseyNoInput = document.getElementById("jerseyNo");
const roleSelect = document.getElementById("role");
const battingStyleSelect = document.getElementById("battingStyle");
const bowlingStyleSelect = document.getElementById("bowlingStyle");

window.onload = () => {
  loadTeams();
  loadPlayers();
};
