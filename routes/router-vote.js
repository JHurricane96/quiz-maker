var express = require("express");
var initdb = require("../initdb");
var ObjectID = require("mongodb").ObjectID;
router = express.Router();

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

module.exports = router;