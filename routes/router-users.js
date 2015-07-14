var express = require("express");
var initdb = require("../initdb");
var ObjectID = require("mongodb").ObjectID;
router = express.Router();

var categories = ["sports", "video games", "science", "literature", "movies and shows", "all"];
var itemsPerRequest = 10;
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

router.get("/search", function (req, res, next) {
	res.render("search");
});

router.get("/history/search", function (req, res, next) {
	res.render("history-search");
});

router.get("/yours/search", function (req, res, next) {
	res.render("yours-search");
});

router.post("/make/submit", function (req, res, next) {
	validateNewQuestion(req.body, function (err, data) {
		if (err)
			return next(err);
		data["upvotes"] = 0;
		data["downvotes"] = 0;
		data["votes"] = 0;
		data["usersVotedUp"] = [];
		data["usersVotedDown"] = [];
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
				usersColl.update({"username": req.session.username}, {$set: {"questions": questions}});
				res.render("message", {"title": "Done!", "message": "Done!"});
			});
		});
	});
});

router.post("/edit/submit", function (req, res, next) {
	if (!req.query)
		return next(new Error("Improper query"));
	if (!req.query.id)
		return next(new Error("Improper query"));
	validateNewQuestion(req.body, function (err, data) {
		if (err)
			return next(err);
		db = initdb.db();
		usersColl = db.collection("users");
		qColl = db.collection("questions");
		usersColl = db.collection("users");
		usersColl.findOne({"username": req.session.username}, function (err, userData) {
			if (!new RegExp(req.query.id).test(userData.questions.join(" ")))
				return next(new Error("You can only edit your own questions"));
			qColl.update({"_id": new ObjectID(req.query.id)}, {$set: {
				"question": data.question,
				"choiceA": data.choiceA,
				"choiceB": data.choiceB,
				"choiceC": data.choiceC,
				"choiceD": data.choiceD,
				"correctAnswer": data.correctAnswer,
				"category": data.category,
				"difficulty": data.difficulty
			}}, function (err) {
				if (err)
					return next(err);
				res.render("message", {"title": "Done!", "message": "Done!"});
			});
		});
	});
});

router.delete("/edit/submit", function (req, res, next) {
	if (!req.query)
		return next(new Error("Improper query"));
	if (!req.query.id)
		return next(new Error("Improper query"));
	db = initdb.db();
	usersColl = db.collection("users");
	qColl = db.collection("questions");
	usersColl.findOne({"username": req.session.username}, function (err, userData) {
		if (err)
			return next(err);
		var found = -1;
		for (var i = 0; i < userData.questions.length; ++i) {
			if (String(userData.questions[i] == req.query.id))
				found = i;
		}
		if (found == -1)
			return next(new Error("Can't edit others' questions"));
		userData.questions.splice(i);
		qColl.deleteOne({"_id": new ObjectID(req.query.id)}, {w: 1}, function (err) {
			if (err)
				return next(err);
			res.send("Done");
		});
	});
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

router.get("/answer/submit/:id", function (req, res, next) {
	if (!req.query)
		return next(new Error("No answer"));
	if (!req.query.answer)
		return next(new Error("No answer"));
	db = initdb.db();
	qColl = db.collection("questions");
	qColl.findOne({"_id": new ObjectID(req.params.id)}, function (err, qData) {
		if (err)
			return next(err);
		if (!qData)
			return next(new Error("Question with this id does not exist"));
		usersColl = db.collection("users");
		usersColl.findOne({"username": req.session.username}, {"score": true, "answeredQuestions": true, "questions": true}, function (err, userData) {
			if (err)
				return next(err);
			if (new RegExp(req.params.id).test(userData.answeredQuestions.join(" ")))
				return res.send("You've already answered this question");
			else if (new RegExp(req.params.id).test(userData.questions.join(" ")))
				return res.send("You can't answer your own question");
			userData.answeredQuestions.push(new ObjectID(req.params.id));
			if (!userData.answers) {
				userData.answers = {};
				userData.answers[req.params.id] = req.query.answer;
			}
			else
				userData.answers[req.params.id] = req.query.answer;
			if (qData.correctAnswer == req.query.answer) {
				res.render("answer-submit", {
					"message": "Congratulations, your answer was correct!",
					"qId": qData._id,
					"score": userData.score + 1,
					"upvotes": qData.upvotes,
					"downvotes": qData.downvotes
				});
				usersColl.update({"username": req.session.username}, {$set: {"answeredQuestions": userData.answeredQuestions, "answers": userData.answers}, $inc: {"score": 1}});
			}
			else {
				res.render("answer-submit", {
					"message": "Oops, it looks like you chose the wrong answer!",
					"qId": qData._id,
					"correctChoice": qData.correctAnswer,
					"correctAnswer": qData["choice" + qData.correctAnswer],
					"score": userData.score - 1,
					"upvotes": qData.upvotes,
					"downvotes": qData.downvotes
				});
				usersColl.update({"username": req.session.username}, {$set: {"answeredQuestions": userData.answeredQuestions, "answers": userData.answers}, $inc: {"score": -1}});
			}
		});
	});
});

router.post("/upvote", function (req, res, next) {
	db = initdb.db();
	if (!req.query.id)
		return next(new Error("Id necessary"));
	qColl = db.collection("questions");
	usersColl = db.collection("users");
	usersColl.findOne({"username": req.session.username}, function (err, userData) {
		if (err)
			return next(err);
		for (var i = 0; i < userData.questions.length; ++i) {
			if (String(userData.questions[i]) == req.query.id)
				return next(new Error("Can't vote for own question"));
		}
		qColl.findOne({"_id": new ObjectID(req.query.id)}, function (err, qData) {
			if (err)
				return next(err);
			if (!qData)
				return next(new Error("Question does not exist"));
			if (req.query.revote == "true") {
				var usersVotedDownPos = qData.usersVotedDown.indexOf(req.session.username);
				var usersVotedUpPos = qData.usersVotedUp.indexOf(req.session.username);
				if (usersVotedUpPos == -1 && usersVotedDownPos == -1)
					return next(new Error("Not voted yet"));
				if (usersVotedUpPos != -1)
					return next(new Error("Already voted up"));
				qData.usersVotedUp.push(req.session.username);
				qData.usersVotedDown.splice(usersVotedDownPos);
				qColl.update({"_id": qData._id}, {$set: {"usersVotedUp": qData.usersVotedUp, "usersVotedDown": qData.usersVotedDown}, $inc: {"upvotes": 1, "votes": 2, "downvotes": -1}}, function (err) {
					if (err)
						return next(err);
					res.send("Upvoted");
				});
			}
			else {
				if (qData.usersVotedUp.indexOf(req.session.username) != -1 || qData.usersVotedDown.indexOf(req.session.username) != -1)
					return next(new Error("Already voted"));
				qData.usersVotedUp.push(req.session.username);
				qColl.update({"_id": qData._id}, {$set: {"usersVotedUp": qData.usersVotedUp}, $inc: {"upvotes": 1, "votes": 1}}, function (err) {
					if (err)
						return next(err);
					res.send("Upvoted");
				});
			}
		});
	});
});

router.post("/downvote", function (req, res, next) {
	console.log(req.query.revote);
	db = initdb.db();
	if (!req.query.id)
		return next(new Error("Id necessary"));
	qColl = db.collection("questions");
	usersColl = db.collection("users");
	usersColl.findOne({"username": req.session.username}, function (err, userData) {
		if (err)
			return next(err);
		for (var i = 0; i < userData.questions.length; ++i) {
			if (String(userData.questions[i]) == req.query.id)
				return next(new Error("Can't vote for own question"));
		}
		qColl.findOne({"_id": new ObjectID(req.query.id)}, function (err, qData) {
			if (err)
				return next(err);
			if (!qData)
				return next(new Error("Question does not exist"));
			if (req.query.revote == "true") {
				var usersVotedUpPos = qData.usersVotedUp.indexOf(req.session.username);
				var usersVotedDownPos = qData.usersVotedDown.indexOf(req.session.username);
				if (usersVotedDownPos == -1 && usersVotedUpPos == -1)
					return next(new Error("Not voted yet"));
				if (usersVotedDownPos != -1)
					return next(new Error("Already voted down"));
				qData.usersVotedDown.push(req.session.username);
				qData.usersVotedUp.splice(usersVotedUpPos);
				qColl.update({"_id": qData._id}, {$set: {"usersVotedUp": qData.usersVotedUp, "usersVotedDown": qData.usersVotedDown}, $inc: {"upvotes": -1, "votes": -2, "downvotes": 1}}, function (err) {
					if (err)
						return next(err);
					res.send("Downvoted");
				});
			}
			else {
				if (qData.usersVotedUp.indexOf(req.session.username) != -1 || qData.usersVotedDown.indexOf(req.session.username) != -1)
					return next(new Error("Already voted"));
				qData.usersVotedDown.push(req.session.username);
				qColl.update({"_id": qData._id}, {$set: {"usersVotedDown": qData.usersVotedDown}, $inc: {"downvotes": 1, "votes": -1}}, function (err) {
					if (err)
						return next(err);
					res.send("Downvoted");
				});
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

function validateNewQuestion(data, callback) {
	var categories = ["science", "sports", "literature", "movies and shows", "video games"];
	if (Object.keys(data).length != 8)
		callback(new Error("Invalid parameters"));
	if (!data.question)
		callback(new Error("No question"));
	if (data.question.length > 255)
		callback(new Error("Question too long"));
	if (!data.choiceA || !data.choiceB || !data.choiceC || !data.choiceD)
		callback(new Error("Absent choice"));
	if (data.choiceA.length > 100 || data.choiceB.length > 100 || data.choiceC.length > 100 || data.choiceD.length > 100)
		callback(new Error("Choice too long"));
	if (!data.correctAnswer)
		callback(new Error("No correct answer"));
	if (!/^[A-D]$/.test(data.correctAnswer))
		callback(new Error("Correct answer out of bounds"));
	if (!data.category)
		callback(new Error("No category"));
	if (categories.indexOf(data.category) == -1)
		callback(new Error("Improper category"));
	if (!data.difficulty)
		callback(new Error("No difficulty"));
	if (!/^[1-3]$/.test(String(data.difficulty)))
		callback(new Error("Improper difficulty"));
	data.question = String(data.question);
	data.choiceA = String(data.choiceA);
	data.choiceB = String(data.choiceB);
	data.choiceC = String(data.choiceC);
	data.choiceD = String(data.choiceD);
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

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = router;