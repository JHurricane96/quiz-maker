function main() {
	var showLoginButton = document.querySelector("#show-login button");
	var showRegisterButton = document.querySelector("#show-register button");
	var showLoginPane = document.getElementById("show-login");
	var showRegisterPane = document.getElementById("show-register");
	var loginForm = document.getElementById("login");
	var registerForm = document.getElementById("register");
	var fadeTime = 300;

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

	showRegisterButton.addEventListener("click", showRegisterForm);
}

window.onload = main;