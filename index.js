function addTeam() {
  const url =
    "https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec" +
    "?action=addTeam" +
    "&teamName=TeamB" +
    "&shortName=TB" +
    "&city=Vizag";

  fetch(url)
    .then(res => res.json())
    .then(res => {
      alert(JSON.stringify(res));
      console.log(res);
    })
    .catch(err => alert("Error: " + err));
}
function listTeams() {
  fetch("https://script.google.com/macros/s/AKfycbwoc84x0cmXWJ6GHzEae4kTJCMdEyvlK7NKq7m12oE6getykgU0UuUUpc37LZcoCuI/exec?action=listTeams")
    .then(res => res.json())
    .then(res => {
      console.log(res);
      alert(JSON.stringify(res.teams));
    });
}
