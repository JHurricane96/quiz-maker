var express = require("express");
var initdb = require("../initdb");
var ObjectID = require("mongodb").ObjectID;
router = express.Router();

var categories = ["sports", "video games", "science", "literature", "movies and shows", "all"];
var itemsPerRequest = 10;
var usersPerRequest = 11;

router.get("/*", function (req, res, next) {
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

router.get("/search", function (req, res, next) {
	res.render("search");
});

router.post("/make/submit", function (req, res, next) {
	validateNewQuestion(req.body, function (err, data) {
		if (err)
			return next(err);
		data["username"] = req.session.username;
		db = initdb.db();
		usersColl = db.collection("users");
		qColl = db.collection("questions");
		usersColl.findOne({"username": req.session.username}, function (err, userData) {
			if (err)
				return next(err);
			qColl.insert(data, {w: 1}, function (err, qData) {
				if (err)
					return next(err);
				var questions = userData.questions || [];
				questions.push(qData.ops[0]._id);
				qColl.update({"_id": qData.ops[0]._id}, {$set: {"_id": String(qData.ops[0]._id)}})
				usersColl.update({"username": req.session.username}, {$set: {"questions": questions}});
				res.send("Done!");
			});
		});
	});
});

router.get("/search/submit", function (req, res, next) {
	res.redirect(((req.query.category == "Select...") ? "all" : req.query.category)  + "/" + ((req.query.difficulty == "Select...") ? "0" : req.query.difficulty));
	return next();
});

router.get("/search/:category/:difficulty", function (req, res, next) {
	validateSearch(req.params, function (err, query) {
		if (err)
			return next(err);
		var category = new RegExp(query.category);
		var difficulty = new RegExp(query.difficulty);
		if (query.category == "all")
			category = new RegExp(".*");
		if (query.difficulty == 0)
			difficulty = new RegExp(".*");
		db = initdb.db();
		usersColl = db.collection("users");
		qColl = db.collection("questions");
		usersColl.findOne({"username": req.session.username}, function (err, userData) {
			if (err)
				return next(err);
			var ownQuestions = userData.questions;
			var answeredQuestions = userData.answeredQuestions || [];
			var options = {
				"sort": [["upvotes", "desc"]],
				"limit": itemsPerRequest
			};
			var searchedPages = [];
			if (!req.query.more)
				req.session.searchPage = [];
			else {
				req.session.searchPage.forEach(function (id) {
					searchedPages.push(ObjectID(id));
				});
			}
			qColl.find({"category": category, "difficulty": difficulty, "_id": { $nin: answeredQuestions.concat(ownQuestions, searchedPages) }}, {"question": true}, options).toArray(function (err, qFound) {
				if (err)
					return next(err);
				qFound.forEach(function (question) {
					req.session.searchPage.push(String(question._id));
					req.session.save();
				});
				if (!qFound)
					var qFound = [true];
				else if (qFound.length < itemsPerRequest)
					qFound[qFound.length] = true;
				if (req.query.more != "true")
					res.render("search-results", {"questions": qFound});
				else if (req.query.more == "true")
					res.send(JSON.stringify(qFound));
			});
		});
	});
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

router.get("/answer/submit/:id", function (req, res, next) {
	if (!req.query)
		return next(new Error("No answer"));
	if (!req.query.answer)
		return next(new Error("No answer"));
	db = initdb.db();
	qColl = db.collection("questions");
	qColl.findOne({"_id": new ObjectID(req.params.id)}, function (err, data) {
		if (err)
			return next(err);
		if (!data)
			return next(new Error("Question with this id does not exist"));
		usersColl = db.collection("users");
		usersColl.findOne({"username": req.session.username}, {"score": true, "answeredQuestions": true}, function (err, userData) {
			if (err)
				return next(err);
			if (new RegExp(req.params.id).test(userData.answeredQuestions.join(" ")))
				return res.send("You've already answered this question");
			userData.answeredQuestions.push(new ObjectID(req.params.id));
			if (data.correctAnswer == req.query.answer) {
				res.render("answer-submit", {"message": "Congratulations, your answer was correct!", "score": userData.score + 1});
				usersColl.update({"username": req.session.username}, {$set: {"answeredQuestions": userData.answeredQuestions}, $inc: {"score": 1}});
			}
			else {
				res.render("answer-submit", {
					"message": "Oops, it looks like you chose the wrong answer!",
					"correctChoice": data.correctAnswer,
					"correctAnswer": data["choice" + data.correctAnswer],
					"score": userData.score - 1
				});
				usersColl.update({"username": req.session.username}, {$set: {"answeredQuestions": userData.answeredQuestions}, $inc: {"score": -1}});
			}
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
			}
			else if (req.query.more != "true") {
				usersColl.find({}, {"score": true, "username": true}, {"sort": [["score", "desc"], ["username", "asc"]], "limit": usersPerRequest}).toArray(function (err, userData) {
					if (err)
						return next(err);
					res.render("leaderboard", {
						"curUsername": req.session.username,
						"curUserScore": curUserData.score,
						"curUserRank": curUserRank + 1,
						"users": userData
					});
				});
			}
		});
	});
});

function validateNewQuestion(data, callback) {
	data["upvotes"] = 0;
	data["downvotes"] = 0;
	data["usersVotedUp"] = [];
	data["usersVotedDown"] = [];
	callback("", data);
}

function validateSearch(data, callback) {
	var err = "Improper search parameters";
	if (!data)
		return callback(new Error(err));
	if (!data.category || !data.difficulty)
		return callback(new Error(err));
	if (categories.indexOf(data.category) == -1)
		return callback(new Error(err));
	var difficulty = parseInt(data.difficulty, 10);
	if (difficulty < 0 || difficulty > 3)
		return callback(new Error(err));
	callback("", data);
}

module.exports = router;