function main() {
	var board = document.getElementById("board");
	var allUsersLoaded = false;

	function loadRanks() {
		if (window.innerHeight + pageYOffset >= document.body.offsetHeight - 100) {
			window.removeEventListener("scroll", loadRanks);
			console.log("Bottom");
			var req = new XMLHttpRequest();
			req.open("GET", "?more=true&lastscore=" + lastRankScore + "&lastname=" + lastRankName, true);
			req.addEventListener("load", function() {
				if (req.status < 400) {
					var newInfo = JSON.parse(req.responseText);
					if (newInfo[newInfo.length - 1] === true) {
						moreButton.style.display = "none";
						newInfo.pop();
						allUsersLoaded = true;
					}
					lastRankScore = newInfo[newInfo.length - 1].score;
					lastRankName = newInfo[newInfo.length - 1].username;
					newDiv = makeDiv(newInfo);
					var scrollY = pageYOffset;
					board.appendChild(newDiv);
					window.scrollTo(0, scrollY);
					if (!allUsersLoaded)
						window.addEventListener("scroll", loadRanks);
				}
			});
			req.send(null);
		}
	}

	window.addEventListener("scroll", loadRanks);

}

function makeDiv(users) {
	var newDiv = document.createElement("div");
	for (var i = 0; i < users.length; ++i) {
		var newRankDiv = document.createElement("div");
		var newLi = document.createElement("li");
		newRankDiv.className = "container-rank";
		if (users[i].username == curUsername)
			newRankDiv.id = "your-rank";
		newLi.innerHTML = +i+1+userCount +  ". " + users[i].username + ": " + users[i].score;
		newRankDiv.appendChild(newLi);
		newDiv.appendChild(newRankDiv);
	}
	userCount += users.length;
	return newDiv;
}

window.onload = main;