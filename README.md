Quiz Maker
==========

A simple web application to let users make questions and answer questions posted by other users.

Build Instructions
------------------

1. Install Node and MongoDB.
2. Clone the repository to your machine.
3. `cd` to the directory.
4. Run `npm install` to install dependencies.
5. Run `node initq.js` if you wish to have sample (albeit useless) questions to test.
6. Run `node initu.js` if you wish to have sample (albeit unusable) users to test the leaderboard.
6. Run `node first-time.js` to set up the database.
7. Run `npm start` to start the site.

Usage
-----

The application runs on port 3000. If the files are on your machine, `localhost:3000/` will get you to the login and
registration screen. Create an account and use the application.

Routes
------

* `/`, get: Takes you to the login or home page, depending on whether you're logged in.
* `/login`, get: The login and registration page.
* `/login/submit`, post: Submits login info.
* `/register/submit`, post: Submits registration info.
* `/login/retry`, get: A failed login attempt redirects you to this page. If you have not failed a login attempt, this page will redirect
you to the normal login page.
* `/check`, get: A route that accepts one query string, `username`, and checks if it exists.
* `/logout`, get: Destroys the current session and redirects you to the login page.  
The following pages are accessible only to users who have logged in.
* `/home`, get: The home page. All the routes following this one are mounted on `/home`.
* `/make`, get: A form for creating a question.
  * `/make/submit`, post: Post your own question.
* `/answer`, get: Provides a form for answering an unanswered question whose id matches the `id` query string.
  * `/answer/submit/:id`, get: Submit the answer to the unanswered question whose id matches the `id` parameter. The chosen option (`A`, 
  `B`, `C`, `D`) is specified as a query string (`answer`).
  * `/search`, get: An advanced search for unanswered questions.
  * `/search/submit`, get: Submit your search. Accepts `category`, `difficulty` and `question` (a string to match question titles with)
  as query strings. Redirects you to the following route.
  * `/search/:category/:difficulty`, get: Fetches you the first 10 unanswered questions (or less) in descending order of votes that are in the same category as `category` and the same difficulty as `difficulty`. Note that the easy, medium and hard difficulties map to 1, 2, and 3 in the url. Also, if all categories need to be searched,
  `category` can be made `all` and setting `difficulty` to `0` has the same effect. An optional `question` query string can also be attached.
  It has the same function as in the above route.
  * `/search/:category/:difficulty?more=true`, get: This is not really another route, but is listed separetely for clarity. This route, apart from the `question` query string, **requires** two more query strings: `lastscore` and `lastquestions`. It returns, in json, a list of atmost 10 questions whose score (votes) is less than or equal to `lastscore` and whose id is not in `lastquestions`.
* `/history`, get: Shows you an answered question whose id matches the `id` in the query string.
  * `/history/search`, get: An advanced search for answered questions.
  * `/history/search/:category/:difficulty`, get: Look at `/search/:category/:difficulty`. Similar, except that it seaches for answered questions instead.
  * `/history/search/:category/:difficulty?more=true`, get: Look at `/search/:category/:difficulty?more=true`. Similar, except that it searches
  for answered questions instead.
* `/edit`, get: Provides a form for editing a question made by the current user whose id matches the `id` query string.
  * `/yours/search`, get: An advanced search for questions made by the current user.
  * `/yours/search/:category/:difficulty`, get: Look at `/search/:category/:difficulty`. Similar, except that it seaches for questions made by the current user instead.
  * `/yours/search/:category/:difficulty?more=true`, get: Look at `/search/:category/:difficulty?more=true`. Similar, except that it searches
  for questions made by the current user instead.
  * `/edit/submit`, post: Edit your own question. `id` must be provided as a query string.
  * `/edit/submit`, delete: Delete your own question. id` must be provided as a query string.
* `/upvote`, post: Upvotes a question (which was not made by the current user) that has not yet been voted for by the current user. If the query string `revote` is `true`, then if the user has already downvoted, his vote is recast as an upvote.
* `/downvote`, post: Similar to upvote, except this route is for downvoting.
* `/leaderboard/ranks`, get: A page with the current user's rank and the top ten (or less) users with their scores and ranks. If the query string `more` is `true`, and the query strings `lastscore` (which must be an integer) and `lastnames` (which is a series of strings) are provided, atmost 10 users whose scores are less than or equal to `lastscore` and whose usernames are not in the list `lastnames`, along with their scores and ranks, are sent as JSON.

Collections
-----------

There is one database, `quizMaker`. It has two collections, `users` and `questions`. A document in the `users` collection has the following fields:
* name
* username
* password (SHA512 hashed)
* score
* questions (an array of question ID's that this user has set)
* answeredQuestions (an array of question ID's that this user has answered)
* answers (a list of answers to the questions that the user has answered. answer[questionID] gives the user's answer)  
A document in the `questions` collection has the following fields:
* question (the question itself)
* choiceA to choiceD (the four choices)
* correctAnswer (the correct choice - A, B, C or D)
* category
* difficulty
* upvotes
* downvotes
* votes
* usersVotedUp (a list of usernames who have upvoted this question)
* usersVotedDown (a list of usernames who have downvoted this question)
* username (the username of the user who set the question)

###Relations

Any list/array of questions in `users` refers to a list of ID's of questions. These ID's are the default ObjectID's set by MongoDB. Any list/array of users in `questions` refers to a list of usernames.

Necessary Software
------------------

* [Node.js](https://nodejs.org/)
* [MongoDB](https://www.mongodb.org/)

Dependencies
------------

* [Express.js](http://www.expressjs.com): A framework for Node.
* [MongoDB Node driver](http://mongodb.github.io/node-mongodb-native): The Node driver for the MongoDB database.
* [Body parser](https://github.com/expressjs/body-parser): Parses requests.
* [Embedded JS](http://www.embeddedjs.com): A view engine that uses embedded javascript.
* [Express session](https://github.com/expressjs/session): Enables session handling.
* [Path](https://nodejs.org/api/path.html): Handles and transforms file and folder paths.
* [SHA 512](https://www.npmjs.com/package/js-sha512): Hashing module.

Screenshots
-----------

![Login](/screenshots/Login.png)
![Home](/screenshots/Home.png)
![Search](/screenshots/Search.png)
![Results](/screenshots/Results.png)
![Question](/screenshots/Question.png)
![Make](/screenshots/Make.png)
![Leaderboard](/screenshots/Leaderboard.png)
![History](/screenshots/History.png)