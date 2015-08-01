var express = require("express");
var initdb = require("../initdb");
var ObjectID = require("mongodb").ObjectID;
router = express.Router();

var categories = ["sports", "video games", "science", "literature", "movies and shows", "all"];
var itemsPerRequest = 10;

router.get("/search", function (req, res, next) {
	res.render("search");
});

router.get("/history/search", function (req, res, next) {
	res.render("history-search");
});

router.get("/yours/search", function (req, res, next) {
	res.render("yours-search");
});

router.get("/search/submit", function (req, res, next) {
	res.redirect(((req.query.category == "Select...") ? "all" : req.query.category)  + "/" + ((req.query.difficulty == "Select...") ? "0" : req.query.difficulty) + "?question=" + req.query.question);
});

router.get("/history/search/submit", function (req, res, next) {
	res.redirect(((req.query.category == "Select...") ? "all" : req.query.category) + "/" + ((req.query.difficulty == "Select...") ? "0" : req.query.difficulty) + "?question=" + req.query.question);
});

router.get("/yours/search/submit", function (req, res, next) {
	res.redirect(((req.query.category == "Select...") ? "all" : req.query.category) + "/" + ((req.query.difficulty == "Select...") ? "0" : req.query.difficulty) + "?question=" + req.query.question);
});

router.get("/search/:category/:difficulty", function (req, res, next) {
	validateSearch(req.params, function (err, query) {
		if (err)
			return next(err);
		var searchQuestion = new RegExp(escapeRegExp(req.query.question), "i");
		var category = new RegExp(query.category);
		var difficulty = new RegExp(query.difficulty);
		if (query.category == "all")
			category = new RegExp(".*");
		if (query.difficulty == 0)
			difficulty = new RegExp(".*");
		if (req.query.question == "")
			searchQuestion = new RegExp(".*");
		db = initdb.db();
		usersColl = db.collection("users");
		qColl = db.collection("questions");
		usersColl.findOne({"username": req.session.username}, function (err, userData) {
			if (err)
				return next(err);
			var ownQuestions = userData.questions || [];
			var answeredQuestions = userData.answeredQuestions || [] || [];
			var options = {
				"sort": [["votes", "desc"]],
				"limit": itemsPerRequest
			};
			if (req.query.more == "true") {
				if (/^-?[0-9]*$/.test(req.query.lastscore) && req.query.lastquestions) {
					var lastScore = parseInt(req.query.lastscore, 10);
					var lastQuestions = req.query.lastquestions.split(" ").map(function (question) {
						return new ObjectID(question);
					});
					var ignoreQuestions = ownQuestions.concat(answeredQuestions, lastQuestions);
					qColl.find({
						"question": searchQuestion,
						"category": category,
						"difficulty": difficulty,
						"votes": {$lte: lastScore},
						"_id": {$nin: ignoreQuestions}
					},
					{
						"question": true,
						"votes": true,
						"difficulty": true
					},
					options).toArray( function (err, qData) {
						if (err)
							return next(err);
						if (!qData)
							var qData = [true];
						else if (qData.length < itemsPerRequest)
							qData[qData.length] = true;
						res.send(qData);
					});
				}
				else
					return next(new Error("Invalid query"));
			}
			else {
				var ignoreQuestions = ownQuestions.concat(answeredQuestions);
				qColl.find({
					"question": searchQuestion,
					"category": category,
					"difficulty": difficulty,
					"_id": {$nin: ignoreQuestions}
				},
				{
					"question": true,
					"votes": true,
					"difficulty": true
				},
				options).toArray(function (err, qData) {
					if (err)
						return next(err);
					if (qData.length < itemsPerRequest)
						var done = true;
					else
						var done = false;
					if (qData.length == 0)
						res.render("message", {"title": "Results", "message": "Nothing here, move along."});
					else {
						res.render("search-results", {"questions": qData, "done": done});
					}
				});
			}
		});
	});
});

router.get("/history/search/:category/:difficulty", function (req, res, next) {
	validateSearch(req.params, function (err, query) {
		if (err)
			return next(err);
		var category = new RegExp(query.category);
		var difficulty = new RegExp(query.difficulty);
		var searchQuestion = new RegExp(escapeRegExp(req.query.question), "i");
		if (query.category == "all")
			category = new RegExp(".*");
		if (query.difficulty == 0)
			difficulty = new RegExp(".*");
		if (req.query.question == "")
			searchQuestion = new RegExp(".*");
		db = initdb.db();
		usersColl = db.collection("users");
		qColl = db.collection("questions");
		usersColl.findOne({"username": req.session.username}, function (err, userData) {
			if (err)
				return next(err);
			var answeredQuestions = userData.answeredQuestions || [];
			var options = {
				"sort": [["votes", "desc"]],
				"limit": itemsPerRequest
			};
			if (req.query.more == "true") {
				if (/^-?[0-9]*$/.test(req.query.lastscore) && req.query.lastquestions) {
					var lastScore = parseInt(req.query.lastscore, 10);
					var lastQuestions = req.query.lastquestions.split(" ").map(function (question) {
						return new ObjectID(question);
					});
					qColl.find({
						"question": searchQuestion,
						"category": category,
						"difficulty": difficulty,
						"votes": {$lte: lastScore},
						"_id": {$in: answeredQuestions, $nin: lastQuestions}
					},
					{
						"question": true,
						"votes": true,
						"difficulty": true
					},
					options).toArray( function (err, qData) {
						if (err)
							return next(err);
						if (!qData)
							var qData = [true];
						else if (qData.length < itemsPerRequest)
							qData[qData.length] = true;
						res.send(qData);
					});
				}
				else
					return next(new Error("Invalid query"));
			}
			else {
				qColl.find({
					"question": searchQuestion,
					"category": category,
					"difficulty": difficulty,
					"_id": {$in: answeredQuestions}
				},
				{
					"question": true,
					"votes": true,
					"difficulty": true
				},
				options).toArray(function (err, qData) {
					if (err)
						return next(err);
					if (qData.length < itemsPerRequest)
						var done = true;
					else
						var done = false;
					if (qData.length == 0)
						res.render("message", {"title": "Results", "message": "Nothing here, move along."});
					else
						res.render("history-results", {"questions": qData, "done": done});
				});
			}
		});
	});
});

router.get("/yours/search/:category/:difficulty", function (req, res, next) {
	validateSearch(req.params, function (err, query) {
		if (err)
			return next(err);
		var category = new RegExp(query.category);
		var difficulty = new RegExp(query.difficulty);
		var searchQuestion = new RegExp(escapeRegExp(req.query.question), "i");
		if (query.category == "all")
			category = new RegExp(".*");
		if (query.difficulty == 0)
			difficulty = new RegExp(".*");
		if (req.query.question == "")
			searchQuestion = new RegExp(".*");
		db = initdb.db();
		usersColl = db.collection("users");
		qColl = db.collection("questions");
		usersColl.findOne({"username": req.session.username}, function (err, userData) {
			if (err)
				return next(err);
			var ownQuestions = userData.questions || [];
			var options = {
				"sort": [["votes", "desc"]],
				"limit": itemsPerRequest
			};
			if (req.query.more == "true") {
				if (/^-?[0-9]*$/.test(req.query.lastscore) && req.query.lastquestions) {
					var lastScore = parseInt(req.query.lastscore, 10);
					var lastQuestions = req.query.lastquestions.split(" ").map(function (question) {
						return new ObjectID(question);
					});
					qColl.find({
						"question": searchQuestion,
						"category": category,
						"difficulty": difficulty,
						"votes": {$lte: lastScore},
						"_id": {$in: ownQuestions, $nin: lastQuestions}
					},
					{
						"question": true,
						"votes": true,
						"difficulty": true
					},
					options).toArray( function (err, qData) {
						if (err)
							return next(err);
						if (!qData)
							var qData = [true];
						else if (qData.length < itemsPerRequest)
							qData[qData.length] = true;
						res.send(qData);
					});
				}
				else
					return next(new Error("Invalid query"));
			}
			else {
				qColl.find({
					"question": searchQuestion,
					"category": category,
					"difficulty": difficulty,
					"_id": {$in: ownQuestions}
				},
				{
					"question": true,
					"votes": true,
					"difficulty": true
				},
				options).toArray(function (err, qData) {
					if (err)
						return next(err);
					if (qData.length < itemsPerRequest)
						var done = true;
					else
						var done = false;
					if (qData.length == 0)
						res.render("message", {"title": "Results", "message": "Nothing here, move along."});
					else
						res.render("yours-results", {"questions": qData, "done": done});
				});
			}
		});
	});
});

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

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = router;