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
6. Run `node first-time.js` to set up a database.
7. Run `npm start` to start the site.

Usage
-----

The application runs on port 3000. If the files are on your machine, `localhost:3000/login` will get you to the login and
registration screen. Create an account and use the application. Right now, only posting and viewing other users' questions is supported.
Therefore the enjoyment one can extract from this is severely limited (as of now).

Things to do
------------

* Sanitize input properly.
* Add links to searches.
* Refine search.