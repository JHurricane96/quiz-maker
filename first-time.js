var MongoClient = require("mongodb").MongoClient;

MongoClient.connect("mongodb://localhost:27017/quizMaker", function (err, db) {
	if (err)
		error(err);
	console.log("Made database");
	db.createCollection("users", function (err, coll) {
		if (err)
			error(err);
		console.log("Made users collection");
		coll.ensureIndex({username: 1}, {unique: true}, function (err) {
			if (err)
				error(err);
			console.log("Made username a unique field");
		});
	});
	db.createCollection("questions", function (err, coll) {
		if (err)
			error(err);
		console.log("Made questions collection");
	});
});

function error (err) {
	console.log(err.message);
	throw err;
}