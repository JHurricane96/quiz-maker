function main() {
	var showLoginButton = document.querySelector("#show-login button");
	var showRegisterButton = document.querySelector("#show-register button");
	var showLoginPane = document.getElementById("show-login");
	var showRegisterPane = document.getElementById("show-register");
	var loginForm = document.getElementById("login");
	var registerForm = document.getElementById("register");
	var fadeTime = 300;

	var passwordInputsRegister = document.querySelectorAll("form#register input[type=\"password\"]");
	var userNameRegister = document.querySelector("form#register input[name=\"username\"]");
	var passwordInputLogin = document.querySelector("form#login input[type=\"password\"]");
	var userNameLogin = document.querySelector("form#login input[name=\"username\"]");

	function showRegisterForm() {
		showRegisterPane.style.display = "none";
		showLoginPane.style.display = "block";
		showRegisterButton.removeEventListener("click", showRegisterForm);
		loginForm.style.opacity = 1;
		animate(function (t) {return t;}, fadeTime, function (x) {loginForm.style.opacity = 1 - x;}, function () {
			loginForm.style.display = "none";
			registerForm.style.opacity = 0;
			registerForm.style.display = "block";
			animate(function (t) {return t;}, fadeTime, function (x) {registerForm.style.opacity = x;}, function () {
				showLoginButton.addEventListener("click", showLoginForm);
			});
		});
	}

	function showLoginForm() {
		showLoginPane.style.display = "none";
		showRegisterPane.style.display = "block";
		showLoginButton.removeEventListener("click", showLoginForm);
		registerForm.style.opacity = 1;
		animate(function (t) {return t;}, fadeTime, function (x) {registerForm.style.opacity = 1 - x;}, function () {
			registerForm.style.display = "none";
			loginForm.style.opacity = 0;
			loginForm.style.display = "block";
			animate(function (t) {return t;}, fadeTime, function (x) {loginForm.style.opacity = x;}, function () {
				showRegisterButton.addEventListener("click", showRegisterForm);
			});
		});
	}

	function validatePasswordRegister(event) {
		if (event.target.validity.patternMismatch)
			passwordInputsRegister[0].setCustomValidity("Only alphabets, numbers, underscores and periods are allowed");
		else if (passwordInputsRegister[0].value != passwordInputsRegister[1].value)
			passwordInputsRegister[1].setCustomValidity("Both passwords should be the same");
		else {
			passwordInputsRegister[0].setCustomValidity("");
			passwordInputsRegister[1].setCustomValidity("");
		}
	}

	function validateUserNameRegister(event) {
		var userName = event.target.value;
		if (event.target.validity.patternMismatch)
			event.target.setCustomValidity("Only alphabets, numbers, underscores and periods are allowed");
		else if (!event.target.validity.patternMismatch) {
			event.target.setCustomValidity("");
			var req = new XMLHttpRequest();
			req.open("GET", "/check?username=" + userName, true);
			req.addEventListener("load", function() {
				if (req.status < 400) {
					console.log("hey");
					if (req.responseText == "Valid username")
						event.target.setCustomValidity("");
					else if (req.responseText == "Empty username")
						event.target.setCustomValidity("A username is necessary!");
					else
						event.target.setCustomValidity("This username has already been taken!");
				}
			});
			req.send(null);
		}
	}

	function validateLoginField(event) {
		if (event.target.validity.patternMismatch)
			event.target.setCustomValidity("Only alphabets, numbers, underscores and periods are allowed");
		else
			event.target.setCustomValidity("");
	}

	userNameRegister.addEventListener("keyup", validateUserNameRegister);
	passwordInputsRegister[0].addEventListener("keyup", validatePasswordRegister);
	passwordInputsRegister[1].addEventListener("keyup", validatePasswordRegister);
	showRegisterButton.addEventListener("click", showRegisterForm);
	userNameLogin.addEventListener("keyup", validateLoginField);
	passwordInputLogin.addEventListener("keyup", validateLoginField);
}

window.onload = main;