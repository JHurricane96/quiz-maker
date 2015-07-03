var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var routerLogin = require("./routes/router-login");
var routerUsers = require("./routes/router-users");
require("./initdb");
var app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.set("view cache", false);

app.use(session({secret: "keyboard-cat", saveUninitialized: true, resave: false}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + "/public"));
app.use(routerLogin);
app.use("/home", routerUsers);

app.use(function (err, req, res, next) {
	res.send(err);
	throw err;
});

app.listen(3000, function () {
	console.log("Listening on port 3000...");
});