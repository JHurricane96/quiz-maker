function main() {
	var upvoteButton = document.querySelector("#upvote");
	var downvoteButton = document.querySelector("#downvote");
	var upvotes = document.querySelector("#upvotes");
	var downvotes = document.querySelector("#downvotes");

	function downvote() {
		var req = new XMLHttpRequest();
		req.open("POST", "/home/downvote?id=" + qId, true);
		req.addEventListener("load", function() {
			if (req.status < 400) {
				if (req.responseText == "Downvoted") {
					downvotes.innerHTML = parseInt(downvotes.innerHTML) + 1;
					downvoteButton.removeEventListener("click", downvote);
				}
			}
		});
		req.send(null);
	}

	function upvote() {
		var req = new XMLHttpRequest();
		req.open("POST", "/home/upvote?id=" + qId, true);
		req.addEventListener("load", function() {
			if (req.status < 400) {
				console.log(req.responseText);
				if (req.responseText == "Upvoted") {
					upvotes.innerHTML = parseInt(upvotes.innerHTML) + 1;
					upvoteButton.removeEventListener("click", upvotes);
				}
			}
		});
		req.send(null);
	}

	upvoteButton.addEventListener("click", upvote);
	downvoteButton.addEventListener("click", downvote);
}

window.onload = main;