var MongoClient = require("mongodb").MongoClient;

var _db = null;
MongoClient.connect("mongodb://localhost:27017/quizMaker", function (err, db) {
	if (err)
		throw err;
	console.log("Established connection with database");
	_db = db;
});

module.exports.db = function () {
	return _db;
}