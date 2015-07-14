function main() {
	var upvoteButton = document.querySelector("#upvote");
	var downvoteButton = document.querySelector("#downvote");
	var upvotes = document.querySelector("#upvotes");
	var downvotes = document.querySelector("#downvotes");

	function downvote() {
		var req = new XMLHttpRequest();
		var reqUrl = "/home/downvote?id=" + qId;
		if (voteStatus == "up")
			reqUrl += "&revote=true";
		req.open("POST", reqUrl, true);
		req.addEventListener("load", function() {
			if (req.status < 400) {
				if (req.responseText == "Downvoted") {
					downvotes.innerHTML = parseInt(downvotes.innerHTML) + 1;
					if (voteStatus != "not voted")
						upvotes.innerHTML = parseInt(upvotes.innerHTML) - 1;
					downvoteButton.removeEventListener("click", downvote);
					upvoteButton.addEventListener("click", upvote);
					voteStatus = "down";
				}
			}
		});
		req.send(null);
	}

	function upvote() {
		var req = new XMLHttpRequest();
		var reqUrl = "/home/upvote?id=" + qId;
		if (voteStatus == "down")
			reqUrl += "&revote=true";
		req.open("POST", reqUrl, true);
		req.addEventListener("load", function() {
			if (req.status < 400) {
				console.log(req.responseText);
				if (req.responseText == "Upvoted") {
					upvotes.innerHTML = parseInt(upvotes.innerHTML) + 1;
					if (voteStatus != "not voted")
						downvotes.innerHTML = parseInt(downvotes.innerHTML) - 1;
					upvoteButton.removeEventListener("click", upvote);
					downvoteButton.addEventListener("click", downvote);
					voteStatus = "up";
				}
			}
		});
		req.send(null);
	}

	console.log(voteStatus);
	if (voteStatus == "up")
		downvoteButton.addEventListener("click", downvote);
	else if (voteStatus == "down")
		upvoteButton.addEventListener("click", upvote);
	else {
		upvoteButton.addEventListener("click", upvote);
		downvoteButton.addEventListener("click", downvote);
	}

}

window.onload = main;