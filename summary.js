const MATCH_ID = "M001";
const API = "YOUR_EXEC_URL";

fetch(API + "?action=summary&match_id=" + MATCH_ID)
  .then(r => r.json())
  .then(render);

function render(data){

  let bat = document.getElementById("batting");
  let bowl = document.getElementById("bowling");

  for (let p in data.batting) {
    let b = data.batting[p];
    bat.innerHTML += `<tr>
      <td>${p}</td>
      <td>${b.runs}</td>
      <td>${b.balls}</td>
      <td>${b.out ? "Out" : "Not Out"}</td>
    </tr>`;
  }

  for (let bw in data.bowling) {
    let b = data.bowling[bw];
    let overs = Math.floor(b.balls/6) + "." + (b.balls%6);
    bowl.innerHTML += `<tr>
      <td>${bw}</td>
      <td>${overs}</td>
      <td>${b.runs}</td>
      <td>${b.wickets}</td>
    </tr>`;
  }
}
