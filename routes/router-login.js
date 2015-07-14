var express = require("express");
var session = require("express-session");
var initdb = require("../initdb");
router = express.Router();

router.get("/*", function (req, res, next) {
	res.setHeader("cache-control", "no-cache, max-age=0, must-revalidate, no-store");
	return next();
});

router.get("/", function (req, res, next) {
	if (!req.session.login)
		res.redirect("/login");
	else if (req.session.login == "Logged in")
		res.redirect("/home");
	else
		return next();
});

router.get("/logout", function (req, res, next) {
	req.session.destroy();
	res.redirect("/login");
});

router.use(/\/login|\/register|\/check/, function (req, res, next) {
	if (req.session["login"] == "Logged in")
		res.redirect("/home");
	else
		return next();
});

router.get("/check", function (req, res, next) {
	if (!req.query.username)
		return next(new Error("Invalid query"));
	db = initdb.db();
	usersColl = db.collection("users");
	usersColl.findOne({"username": req.query.username}, function (err, data) {
		if (err)
			return next(err);
		if (data)
			res.send("Existing user exists");
		else
			res.send("Valid username");
	});
});

router.post("/login/submit", function (req, res, next) {
	db = initdb.db();
	usersColl = db.collection("users");
	usersColl.findOne({"username": req.body.username}, function (err, data) {
		if (err)
			return next(err);
		if (!data) {
			req.session["login"] = "The username you entered does not exist.";
			req.session.save();
			res.redirect("/login/retry");
			return;
		}
		if (data.username == req.body.username) {
			if (data.password == req.body.password) {
				req.session["login"] = "Logged in";
				req.session["username"] = req.body.username;
				req.session.save();
				res.redirect("/home");
				return;
			}
			else {
				req.session["login"] = "Your password is incorrect.";
				req.session.save();
				res.redirect("/login/retry");
				return;
			}
		}
	});
});

router.get("/login/retry", function (req, res, next) {
	if (req.session.login == "" || !req.session.login)
		res.redirect("/login");
	else if (req.session.login == "Logged in")
		res.redirect("/home");
	else
		res.render("login-retry", {message: req.session.login});
});

router.get("/login", function (req, res, next) {
	res.render("login");
});

router.post("/register/submit", function (req, res, next) {
	db = initdb.db();
	usersColl = db.collection("users");
	verifyRegister(req.body, function (err, data) {
		if (err)
			return next(err);
		usersColl.insert(data, {w: 1}, function (err, result) {
			if (err)
				return next(err);
			req.session["login"] = "Logged in";
			req.session["username"] = req.body.username;
			req.session.save();
			res.redirect("/home");
		});
	});
});

function verifyRegister(data, callback) {
	if (Object.keys(data).length != 3)
		return callback(new Error("Incorrect number of parameters"));
	if (!data.username)
		return callback(new Error("No username"));
	if (data.username.length > 32 || !/^[0-9a-zA-Z_.]*$/.test(data.username))
		return callback(new Error("Improper username"));
	if (!data.name)
		return callback(new Error("No name"));
	if (data.name.length >32)
		return callback(new Error("Improper name"));
	if (!data.password)
		return callback(new Error("No password"));
	if (data.password.length > 32 || !/[0-9a-zA-Z_.]*/.test(data.password))
		return callback(new Error("Improper password"));
	data.username = String(data.username).trim();
	data.name = String(data.name).trim();
	data.password = String(data.password);
	data.score = 0;
	data.questions = [];
	data.answeredQuestions = [];
	data.answers = new Object();
	callback("", data);
}

module.exports = router;