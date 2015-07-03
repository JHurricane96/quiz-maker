var express = require("express");
var session = require("express-session");
var initdb = require("../initdb");
router = express.Router();

router.get("/*", function (req, res, next) {
	res.setHeader("cache-control", "no-cache, max-age=0, must-revalidate, no-store");
	return next();
});

router.get("/logout", function (req, res, next) {
	req.session.destroy();
	res.redirect("/login");
	return next();
});

router.get(/\/login|\/register/, function (req, res, next) {
	if (req.session["login"] == "Logged in") {
		res.redirect("/home");
	}
	return next();
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
			return next();
		}
		if (data.username == req.body.username) {
			if (data.password == req.body.password) {
				req.session["login"] = "Logged in";
				req.session["username"] = req.body.username;
				req.session.save();
				res.redirect("/home");
				return next();
			}
			else {
				req.session["login"] = "Your password is incorrect.";
				req.session.save();
				res.redirect("/login/retry");
				return next();
			}
		}
		return next();
	});
});

router.get("/login/retry", function (req, res, next) {
	if (req.session.login == "" || !req.session.login) {
		res.redirect("/login");
		return next();
	}
	else if (req.session.login == "Logged in") {
		res.redirect("/home");
		return next();
	}
	else
		res.render("login-retry", {message: req.session.login});
});

router.get("/login", function (req, res, next) {
	res.render("login");
});

router.post("/register/submit", function (req, res, next) {
	var data;
	db = initdb.db();
	usersColl = db.collection("users");
	data = verifyRegister(req.body, function (err, data) {
		if (err)
			return next(err);
		usersColl.insert(data);
	});
	req.session["login"] = "Logged in";
	req.session["username"] = req.body.username;
	req.session.save();
	res.redirect("/home");
	return next();
});

function verifyRegister(data, callback) {
	data.questions = [];
	data.answeredQuestions = [];
	callback("", data);
}

module.exports = router;