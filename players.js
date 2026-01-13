const API =
  "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let ALL_TEAMS = [];
let ALL_PLAYERS = [];

/* =========================
   LOAD TEAMS
========================= */
function loadTeams() {
  fetch(API + "?action=getTeams")
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;

      ALL_TEAMS = d.teams;

      const sel = document.getElementById("teamSelect");
      sel.innerHTML = `<option value="">-- Select Team --</option>`;

      d.teams.forEach(t => {
        const op = document.createElement("option");
        op.value = t.teamId;
        op.textContent = `${t.teamName} (${t.shortName})`;
        sel.appendChild(op);
      });
    });
}

/* =========================
   GENERATE PLAYER ID (KEEP AS-IS)
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

        // 🔁 Reload players & show only selected team
        fetchPlayers(() => renderPlayersByTeam(teamId));
      } else {
        alert(d.message);
      }
    });
}

/* =========================
   LOAD ALL PLAYERS (ONCE)
========================= */
function fetchPlayers(callback) {
  fetch(API + "?action=getPlayers")
    .then(r => r.json())
    .then(d => {
      if (d.status !== "ok") return;
      ALL_PLAYERS = d.players;
      if (callback) callback();
    });
}

/* =========================
   RENDER PLAYERS BY TEAM
========================= */
function renderPlayersByTeam(teamId) {
  const box = document.getElementById("playerList");
  box.innerHTML = "";

  if (!teamId) {
    box.style.display = "none";
    return;
  }

  const teamPlayers = ALL_PLAYERS.filter(p => p.teamId === teamId);

  if (teamPlayers.length === 0) {
    box.innerHTML = "<i>No players for this team</i>";
    box.style.display = "block";
    return;
  }

  teamPlayers.forEach(p => {
    box.innerHTML += `
      <div class="player">
        <b>${p.playerName}</b> (${p.playerId})<br>
        ${p.role} | ${p.battingStyle} | ${p.bowlingStyle}
      </div>`;
  });

  box.style.display = "block";
}

/* =========================
   CLEAR FORM
========================= */
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

teamSelect.addEventListener("change", () => {
  renderPlayersByTeam(teamSelect.value);
});

window.onload = () => {
  loadTeams();
  fetchPlayers();               // load once
  document.getElementById("playerList").style.display = "none"; // hide initially
};
