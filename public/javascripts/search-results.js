function main() {
	var moreButton = document.getElementById("more");
	var container = document.querySelector(".container-body");
	var counter = 1;

	function loadMore() {
		var req = new XMLHttpRequest();
		req.open("GET", "?more=true", true);
		req.addEventListener("load", function() {
			if (req.status < 400) {
				var newInfo = JSON.parse(req.responseText);
				if (newInfo[newInfo.length - 1] === true) {
					moreButton.style.display = "none";
					newInfo.pop();
				}
				console.log(newInfo);
				newDiv = makeDiv(newInfo);
				var scrollY = pageYOffset;
				console.log(scrollY);
				container.insertBefore(newDiv, container.childNodes[container.childNodes.length - 1]);
				window.scrollTo(0, scrollY);
			}
		});
		req.send(null);
	}

	moreButton.addEventListener("click", loadMore);
}

function makeDiv(questions) {
	var newDiv = document.createElement("div");
	newDiv.innerHTML = "<br />"
	questions.forEach(function (question) {
		newDiv.innerHTML += "<p>" + question.question + "</p><br />";
	});
	return newDiv;
}

window.onload = main;