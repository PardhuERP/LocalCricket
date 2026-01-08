function addTeam() {
  fetch("https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec", {
    method: "POST",
    body: JSON.stringify({
      action: "addTeam",
      data: {
        teamName: "Team B",
        shortName: "TB",
        city: "Vizag"
      }
    })
  })
  .then(r => r.text())
  .then(t => {
    console.log("RAW RESPONSE:", t);
    alert(t);
  })
  .catch(e => {
    console.error(e);
    alert("ERROR: " + e);
  });
}
