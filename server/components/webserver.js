/**
 * Webserver component
 */

"use strict";

var express      = require('express');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser')
var webapp       = express();
var webserver    = require('http').Server(webapp);
var Promise      = require('bluebird');
var coroutine    = Promise.coroutine;
var path         = require('path');

var webroot = path.resolve(__dirname, '..', '..', 'client');
var AjaxAPI = require('./webserver/ajax');

class Webserver {

    /**
     * Constructor
     */
    constructor() {
        this.ajax = new AjaxAPI();
    }

    /**
     * Start webserver
     * @param config  configuration params for webserver
     * @returns {Promise}
     */
    start(config) {

        var server = this;
        config     = config || {};

        return new Promise((resolve, reject) => {

            var port  = 'port' in config ? config.port : 8080;
            var ip    = 'ip' in config ? config.ip : '0.0.0.0';

            webapp.use(bodyParser.json());
            webapp.use(cookieParser());
            webapp.use(express.static(webroot));
            
            webapp.get('/ajax/recipe/load/:recipeId',   server.ajax.loadRecipe);
            webapp.get('/ajax/recipe/star/:recipeId',   server.ajax.starRecipe);
            webapp.get('/ajax/recipe/unstar/:recipeId', server.ajax.unstarRecipe);

            webapp.post('/ajax/recipe/search', server.ajax.searchRecipes);
            
            // serve main index.html in the case of any other requests for an unknown
            // resource - to support HTML5 routing
            webapp.all('/*', (request, response, next) => {

                return coroutine(function*() {

                    // AJAX requests are aren't expected to be redirected to the AngularJS app
                    if (request.xhr)
                        return response.status(404).send(request.url + ' not found');
                    
                    // Fake being logged in as a particular user, to support 
                    // starring / unstarring recipes
                    var user = yield app.session.getCurrentUser();

                    // Just send the index.html for other files to support HTML5Mode
                    response.cookie('sessionId', user.sessionId, { maxAge: 900000, httpOnly: false});
                    response.sendFile('app/views/index.html', { root: webroot });

                })().catch(app.log.error);

            });

            // start web server ..
            webserver.listen(port, ip, 511, (error, result) => {
                
                if (error) {
                    app.log.error(error);
                    reject(error);
                } else {
                    app.log.info(`Listening for connections on port ${port}.`);
                    resolve();
                }

            });

        });

    }

}

module.exports = Webserver;