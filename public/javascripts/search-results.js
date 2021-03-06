var lastQuestions = [];
var lastScore;

function main() {
	var moreButton = document.getElementById("more");
	var container = document.querySelector(".container-body");
	var counter = 1;
	var curQuestionQuery = location.search.match(/question=([^&]*)/)[1];

	function loadMore() {
		var req = new XMLHttpRequest();
		req.open("GET", "?more=true&lastscore=" + lastScore + "&lastquestions=" + lastQuestions.join("+") + "&question=" + curQuestionQuery, true);
		req.addEventListener("load", function() {
			if (req.status < 400) {
				var newInfo = JSON.parse(req.responseText);
				if (newInfo[newInfo.length - 1] === true) {
					moreButton.style.display = "none";
					newInfo.pop();
				}
				newDiv = makeDiv(newInfo);
				var scrollY = pageYOffset;
				container.insertBefore(newDiv, moreButton);
				moreButton.innerHTML = "More";
				window.scrollTo(0, scrollY);
			}
			else {
				moreButton.innerHTML = "More";
			}
		});
		req.send(null);
		moreButton.innerHTML = "Loading..."
	}

	function initSameScoreFix() {
		firstQuestions.forEach(function (question) {
			if (question.votes == lastScore) {
				lastQuestions.push(question._id);
			}
			else {
				lastScore = question.votes;
				lastQuestions = [question._id];
			}
		});
	}

	initSameScoreFix();

	if (!done)
		moreButton.addEventListener("click", loadMore);
	else
		moreButton.style.display = "none";
}

function makeDiv(questions) {
	var newDiv = document.createElement("div");
	questions.forEach(function (question) {
		//newDiv.innerHTML += "<p><a href=/home/answer?id=" + question._id + " data-hover=\"" + question.question + "\" target=_blank>" + question.question + "</a></p><br />";
		var newParQuestion = document.createElement("p");
		var newParVotes = document.createElement("p");
		var newParDifficulty = document.createElement("p");
		var newA = document.createElement("a");
		newA.setAttribute("href", "/home/answer?id=" + question._id);
		newA.setAttribute("data-hover", question.question);
		newA.setAttribute("target", "_blank");
		newA.innerHTML = question.question;
		newParVotes.innerHTML = "Votes: " + question.votes;
		newParDifficulty.innerHTML = "Difficulty: ";
		if (question.difficulty == 1)
			newParDifficulty.innerHTML += "\u2605\u2606\u2606";
		else if (question.difficulty == 2)
			newParDifficulty.innerHTML += "\u2605\u2605\u2606";
		else
			newParDifficulty.innerHTML += "\u2605\u2605\u2605";
		newParVotes.className = newParDifficulty.className = "container-extra-question";
		newParQuestion.appendChild(newA);
		newDiv.appendChild(newParQuestion);
		newDiv.appendChild(newParVotes);
		newDiv.appendChild(newParDifficulty);
		newDiv.innerHTML += "<br />";
		if (question.votes == lastScore)
			lastQuestions.push(question._id);
		else {
			lastScore = question.votes;
			lastQuestions = [question._id];
		}
	});
	return newDiv;
}

window.onload = main;