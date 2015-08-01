var express = require("express");
var initdb = require("../initdb");
var ObjectID = require("mongodb").ObjectID;
router = express.Router();

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

module.exports = router;