var express = require("express");
var initdb = require("../initdb");
var ObjectID = require("mongodb").ObjectID;
router = express.Router();

var categories = ["sports", "video games", "science", "literature", "movies and shows", "all"];
var usersPerRequest = 10;

router.use("/*", function (req, res, next) {
	if (req.session.login != "Logged in")
		res.send("Please log in or create an account first");
	else {
		return next();
	}
});

router.get("/", function (req, res, next) {
	res.render("home", {"username": req.session.username});
});

router.get("/make", function (req, res, next) {
	res.render("make");
});

router.get("/answer", function (req, res, next) {
	if (!req.query)
		return next(new Error("Improper query"));
	if (!req.query.id)
		return next(new Error("Improper query"));
	db = initdb.db();
	qColl = db.collection("questions");
	qColl.findOne({"_id": new ObjectID(req.query.id)}, function (err, data) {
		if (err)
			return next(err);
		if (!data)
			return next(new Error("Question does not exist"));
		res.render("answer", data);
	});
});

router.get("/edit", function (req, res, next) {
	if (!req.query)
		return next(new Error("Improper query"));
	if (!req.query.id)
		return next(new Error("Improper query"));
	db = initdb.db();
	qColl = db.collection("questions");
	qColl.findOne({"_id": new ObjectID(req.query.id)}, function (err, data) {
		if (err)
			return next(err);
		if (!data)
			return next(new Error("Question does not exist"));
		res.render("edit", data);
	});
});

router.get("/history", function (req, res, next) {
	if (!req.query)
		return next(new Error("Improper query"));
	if (!req.query.id)
		return next(new Error("Improper query"));
	db = initdb.db();
	qColl = db.collection("questions");
	usersColl = db.collection("users");
	usersColl.findOne({"username": req.session.username}, function (err, userData) {
		if (err)
			return next(err);
		qColl.findOne({"_id": new ObjectID(req.query.id)}, function (err, qData) {
			if (err)
				return next(err);
			if (!qData) {
				res.render("message", {"title": "Question not found", "message": "Question not found"});
				return;
			}
			qData["userAnswer"] = userData.answers[req.query.id];
			if (qData.usersVotedUp.indexOf(userData.username) != -1)
				qData["voteStatus"] = "up";
			else if (qData.usersVotedDown.indexOf(userData.username) != -1)
				qData["voteStatus"] = "down";
			else
				qData["voteStatus"] = "not voted";
			res.render("history-question", qData);
		});
	});
});

router.get("/yours", function (req, res, next) {
	if (!req.query)
		return next(new Error("Improper query"));
	if (!req.query.id)
		return next(new Error("Improper query"));
	db = initdb.db();
	qColl = db.collection("questions");
	usersColl = db.collection("users");
	usersColl.findOne({"username": req.session.username}, function (err, userData) {
		if (err)
			return next(err);
		qColl.findOne({"_id": new ObjectID(req.query.id)}, function (err, qData) {
			if (err)
				return next(err);
			if (!qData) {
				res.render("message", {"title": "Question does not exist", "message": "Question does not exist"});
				return;
			}
			res.render("yours-question", qData);
		});
	});
});

router.get("/leaderboard/ranks", function (req, res, next) {
	db = initdb.db();
	usersColl = db.collection("users");
	usersColl.findOne({"username": req.session.username}, function (err, curUserData) {
		if (err)
			return next(err);
		usersColl.count({"score": {$gt: curUserData.score}}, function (err, curUserRank) {
			if (req.query.more == "true") {
				if (/^-?[0-9]*$/.test(req.query.lastscore) && req.query.lastnames) {
					var last = parseInt(req.query.lastscore, 10);
					var lastnames = req.query.lastnames.split(" ");
					usersColl.find({"score": {$lte: last}, "username": {$nin: lastnames}}, {"sort": [["score", "desc"]], "limit": usersPerRequest}).toArray(function (err, userData) {
						if (err)
							return next(err);
						if (!userData)
							var userData = [true];
						else if (userData.length < usersPerRequest)
							userData[userData.length] = true;
						res.send(userData);
					});
				}
				else
					return next(new Error("Invalid query"));
			}
			else if (req.query.more != "true") {
				usersColl.find({}, {"score": true, "username": true}, {"sort": [["score", "desc"], ["username", "asc"]], "limit": usersPerRequest}).toArray(function (err, userData) {
					if (err)
						return next(err);
					if (!userData || userData.length < usersPerRequest)
						var done = true;
					else
						var done = false;
					res.render("leaderboard", {
						"curUsername": req.session.username,
						"curUserScore": curUserData.score,
						"curUserRank": curUserRank + 1,
						"users": userData,
						"done": done
					});
				});
			}
		});
	});
});

module.exports = router;