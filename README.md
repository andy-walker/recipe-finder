Recipe Finder
=============

This is a test exercise, completed for a well known UK organisation prior to an interview.

Introduction
------------
The solution is an Angular Single Page Application (SPA) implementing HTML5 routing. Backend code is written in ES6 running on node, and utilizes Express and Sequelize, amongst other things.

Installation
------------
After cloning this repo, run:

`npm install`

from the root directory, then:

`cd client && bower install && cd ..`

to install client-side dependencies.

Starting
--------
To start the app, run:

`node server.js`

from the root directory. When the server starts, it should create the SQLite database 'recipes.db' in the root directory, initialize models and populate the database with some sample data.

Once the server is started, navigate to http://localhost:5000 in your browser.

Sequelize is also configured to log queries to the console, so you should be able to see the queries the backend is running, as actions are performed in the front-end.

Features not implemented
------------------------
As far as I'm aware, this should implement all the features outlined in the spec, apart from:

* **Pagination of large datasets** - this was more due to lack of time. Could be achieved by adding offset / limit params to the search query being performed, count the number of total pages server-side, then pass that back to the client - the client then knows the current page and total number of pages and can construct the appropriate pagination links
* **Image on recipe detail page** - once again due to lack of time. Could be achieved by adding an image field to the recipes table to hold the file / pathname, and a directory in the webroot to hold the images themselves. And possibly implement some minimal styling so they resize down nicely for on mobile devices.

Things I would improve
----------------------
* **Accessibility** - I haven't really paid much attention to that for the purposes of completing the exercise. Certainly, I suspect the range slider is not that accessible, but it is a nice way to input a time range - I couldn't really think of another way to do that that wasn't horrible.
* **Refactor ajax controllers** - currently the callback handlers for ajax endpoints are all in a single class called ajax.js. Ideally I would want to separate them out into different endpoint classes, maybe inheriting some common functionality from a base endpoint class.
* **Model generation from yaml files** - this is some code I've included from previous projects I've worked on that generates Sequelize models from a directory of yaml files, but it doesn't provide any real way to define relationships / associations (the relationships between entities had to be hard-coded into the Entities class). So while that is a nice idea, I would probably drop that in favour of defining each model in a javascript class, which is how you're supposed to define them.
