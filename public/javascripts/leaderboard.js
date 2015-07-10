var sameRankCount = 0;
var sameRankScore;
var sameRankUsers = [];
var userCount = 0;

function main() {
	var board = document.getElementById("board");
	var allUsersLoaded = false;

	function loadRanks() {
		if (window.innerHeight + pageYOffset >= document.body.offsetHeight - 100) {
			window.removeEventListener("scroll", loadRanks);
			var req = new XMLHttpRequest();
			req.open("GET", "?more=true&lastscore=" + lastRankScore + "&lastnames=" + sameRankUsers.join("+"), true);
			console.log("sent" + "?more=true&lastscore=" + lastRankScore + "&lastnames=" + sameRankUsers.join("+"));
			req.addEventListener("load", function() {
				console.log("receive");
				if (req.status < 400) {
					var newInfo = JSON.parse(req.responseText);
					if (newInfo[newInfo.length - 1] === true) {
						newInfo.pop();
						allUsersLoaded = true;
					}
					lastRankScore = newInfo[newInfo.length - 1].score;
					lastRankName = newInfo[newInfo.length - 1].username;
					newDiv = makeDiv(newInfo);
					board.appendChild(newDiv);
					if (!allUsersLoaded)
						window.addEventListener("scroll", loadRanks);
				}
			});
			req.send(null);
		}
	}

	function initSameRankFix() {
		for (var i = 0; i < firstUsers.length; ++i) {
			if (sameRankScore != firstUsers[i].score) {
				userCount += sameRankCount + 1;
				sameRankCount = 0;
				sameRankScore = firstUsers[i].score;
				sameRankUsers = [firstUsers[i].username];
			}
			else {
				sameRankCount++;
				sameRankUsers.push(firstUsers[i].username);
			}
		}
	}

	initSameRankFix();

	if (!done)
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
		if (sameRankScore != users[i].score) {
			userCount += sameRankCount + 1;
			sameRankCount = 0;
			sameRankScore = users[i].score;
			sameRankUsers = [users[i].username];
		}
		else {
			sameRankCount++;
			sameRankUsers.push(users[i].username);
		}
		newLi.innerHTML = userCount +  ". " + users[i].username + ": " + users[i].score;
		newRankDiv.appendChild(newLi);
		newDiv.appendChild(newRankDiv);
	}
	return newDiv;
}

window.onload = main;