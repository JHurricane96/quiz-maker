var MongoClient = require("mongodb").MongoClient;
var fs = require("fs");

MongoClient.connect("mongodb://localhost:27017/quizMaker", function (err, db) {
	qColl = db.collection("questions");
	fs.readFile("./questions.js", "utf8", function (err, data) {
		if (err)
			throw err;
		data = JSON.parse(data);
		qColl.insert(data, function (err, data) {
			if (err)
				throw err;
			console.log("Inserted sample questions");
		});
	});
});
