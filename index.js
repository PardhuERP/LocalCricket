const MATCH_ID = "MATCH_1767874129183";
const API = "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec";

let actionInProgress = false;
let popupMode = null;

function el(id){ return document.getElementById(id); }

function loadLiveScore() {
  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(r=>r.json())
    .then(d=>{
      if(d.status!=="ok"){ el("state").innerText="WAITING..."; return;}

      el("score").innerText = `${d.totalRuns} / ${d.wickets}`;
      el("overs").innerText = `Overs: ${d.over}.${d.ball}`;
      el("striker").innerText = d.strikerId;
      el("nonStriker").innerText = d.nonStrikerId;
      el("bowler").innerText = d.bowlerId;
      el("state").innerText = d.state;

      handleStateUI(d.state);
    });
}

function handleStateUI(state){
  if(state==="WICKET") openPopup("BATSMAN","Select New Batsman");
  else if(state==="OVER_END") openPopup("BOWLER","Select New Bowler");
  else if(state==="WICKET_OVER_END") openPopup("BATSMAN","Select New Batsman");
  else closePopup();
}

function openPopup(mode,title){
  popupMode=mode;
  el("popupTitle").innerText=title;
  el("popupSelect").innerHTML=`<option>PLAYER_1</option><option>PLAYER_2</option>`;
  el("popup").classList.remove("hidden");
}

function closePopup(){
  popupMode=null;
  el("popup").classList.add("hidden");
}

function confirmPopup(){
  const v=el("popupSelect").value;
  if(!v) return;
  if(popupMode==="BOWLER")
    callAction(`${API}?action=changeBowler&matchId=${MATCH_ID}&newBowlerId=${v}`,true);
  closePopup();
}

function callAction(url,force=false){
  if(actionInProgress&&!force) return;
  actionInProgress=true;
  fetch(url).then(()=>loadLiveScore()).finally(()=>setTimeout(()=>actionInProgress=false,300));
}

function addRun(r){ callAction(`${API}?action=addRun&matchId=${MATCH_ID}&runs=${r}`); }
function addExtra(t){ callAction(`${API}?action=addExtra&matchId=${MATCH_ID}&type=${t}`); }
function addWicket(){ callAction(`${API}?action=addWicket&matchId=${MATCH_ID}&wicketType=BOWLED`); }
function undoBall(){ callAction(`${API}?action=undoBall&matchId=${MATCH_ID}`,true); }

window.onload=()=>{
  loadLiveScore();
  setInterval(loadLiveScore,2000);
};
