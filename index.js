/* =========================
   LOAD LIVE SCORE (UPDATED)
========================= */
function loadLiveScore() {
  // ఒకవేళ API కాల్ ప్రో్రెస్‌లో ఉన్నా, ఒకవేళ అది 5 సెకన్ల కంటే ఎక్కువ సమయం తీసుకుంటే అన్‌బ్లాక్ చేయాలి
  if (actionInProgress) return; 

  fetch(`${API}?action=getLiveState&matchId=${MATCH_ID}`)
    .then(r => r.json())
    .then(d => {
      if (!d || d.status !== "ok") {
        el("state").innerText = "WAITING...";
        return;
      }

      el("teamScore").innerText = `${d.totalRuns}-${d.wickets} (${d.over}.${d.ball})`;
      el("state").innerText = d.state || "NORMAL";

      loadBatsmanStats(d.strikerId, d.nonStrikerId);
      loadBowlerStats(d.bowlerId);

      handleStateUI(d);
    })
    .catch((err) => {
      console.error("Fetch Error:", err);
      el("state").innerText = "OFFLINE";
    });
}

/* =========================
   API HELPER (FIXED)
========================= */
function callAction(url, force = false) {
  if (actionInProgress && !force) return;
  
  actionInProgress = true;
  el("state").innerText = "UPDATING..."; // యూజర్‌కు అప్‌డేట్ అవుతున్నట్లు తెలియజేయడానికి

  fetch(url)
    .then(r => r.json())
    .then(res => {
      console.log("Action Success:", res);
      // వెంటనే స్టేట్ చెక్ చేయకుండా 1 సెకన్ ఆగి లోడ్ చేయాలి
      setTimeout(loadLiveScore, 1000);
    })
    .catch(err => {
      console.error("Action Error:", err);
    })
    .finally(() => {
      // 1.5 సెకన్ల తర్వాత ఖచ్చితంగా లాక్ రిలీజ్ చేయాలి
      setTimeout(() => { actionInProgress = false; }, 1500);
    });
}
