var sameRankCount = 0;
var sameRankScore;
var sameRankUsers = [];
var userCount = 0;

function main() {
	var board = document.getElementById("board");
	var container = document.querySelector(".container-body");
	var allUsersLoaded = false;

	function loadRanks() {
		if (window.innerHeight + pageYOffset >= document.body.offsetHeight - 100) {
			window.removeEventListener("scroll", loadRanks);
			var req = new XMLHttpRequest();
			req.open("GET", "?more=true&lastscore=" + lastRankScore + "&lastnames=" + sameRankUsers.join("+"), true);
			req.addEventListener("load", function() {
				if (req.status < 400) {
					var newInfo = JSON.parse(req.responseText);
					if (newInfo[newInfo.length - 1] === true) {
						newInfo.pop();
						allUsersLoaded = true;
					}
					if (newInfo.length == 0) {
						container.removeChild(document.getElementById("loading-text"));
						return;
					}
					lastRankScore = newInfo[newInfo.length - 1].score;
					lastRankName = newInfo[newInfo.length - 1].username;
					newRows = makeDiv(newInfo);
					newRows.forEach(function (row) {
						board.appendChild(row);
					});
					container.removeChild(document.getElementById("loading-text"));
					if (!allUsersLoaded)
						window.addEventListener("scroll", loadRanks);
				}
				else {
					container.removeChild(document.getElementById("loading-text"));
					window.addEventListener("scroll", loadRanks);
				}
			});
			req.send(null);
			var loadingText = document.createElement("p");
			loadingText.innerHTML = "Loading...";
			loadingText.id = "loading-text";
			loadingText.style.textAlign = "center";
			container.appendChild(loadingText)
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
	var newRows = [];
	for (var i = 0; i < users.length; ++i) {
		var newRow = document.createElement("tr");
		var newCellRank = document.createElement("td");
		var newCellUser = document.createElement("td");
		var newCellScore = document.createElement("td");
		if (users[i].username == curUsername)
			newRow.id = "your-rank";
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
		newCellRank.innerHTML = userCount;
		newCellUser.innerHTML = users[i].username;
		newCellScore.innerHTML = users[i].score;
		newRow.appendChild(newCellRank);
		newRow.appendChild(newCellUser);
		newRow.appendChild(newCellScore);
		newRows.push(newRow);
	}
	return newRows;
}

window.onload = main;