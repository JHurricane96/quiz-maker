var express = require("express");
var initdb = require("../initdb");
var ObjectID = require("mongodb").ObjectID;
router = express.Router();

var categories = ["sports", "video games", "science", "literature", "movies and shows", "all"];
var itemsPerRequest = 10;

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
				if (qFound.length < itemsPerRequest)
					qFound[qFound.length] = true;
				if (!req.query.more)
					res.render("search-results", {"questions": qFound});
				else
					res.send(JSON.stringify(qFound));
			});
		});
	});
});

function validateNewQuestion(data, callback) {
	data["upvotes"] = 0;
	data["downvotes"] = 0;
	data["usersVoted"] = [];
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