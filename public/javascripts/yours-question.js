function main() {
	var removeLink = document.getElementById("remove");
	var confirmMessage = document.getElementById("confirm");
	var confirmDeleteButton = document.getElementById("confirm-delete");
	var rejectDeleteButton = document.getElementById("reject-delete");
	var containerBody = document.querySelector(".container-body");
	var qId = location.search.match(/id=([^&]*)/)[1];

	removeLink.addEventListener("click", function () {
		confirmMessage.style.display = "block";
	});

	function hideConfirmMessage() {
		confirmMessage.style.display = "none";
	}

	rejectDeleteButton.addEventListener("click", hideConfirmMessage);

	function deleteQuestion() {
		rejectDeleteButton.removeEventListener("click", hideConfirmMessage);
		confirmMessage.removeEventListener("click", deleteQuestion);
		var req = new XMLHttpRequest();
		req.open("DELETE", "/home/edit/submit?id=" + qId, true);
		req.addEventListener("load", function () {
			if (req.status < 400) {
				if (req.responseText == "Done") {
					console.log("Deleted");
					confirmMessage.style.display = "none";
					var doneMessage = document.createElement("p");
					doneMessage.innerHTML = "This question has been deleted successfully";
					containerBody.appendChild(doneMessage);
				}
				else {
					rejectDeleteButton.addEventListener("click", hideConfirmMessage);
					confirmMessage.addEventListener("click", deleteQuestion);
				}
			}
		}) ;
		req.send(null);
	}

	confirmDeleteButton.addEventListener("click", deleteQuestion);
}

window.onload = main;