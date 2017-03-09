/**
 * Recipe Finder
 * @author andyw@home, 08/03/2017
 */
 
"use strict";

var Component = {
    
    Config:    require('./server/components/config'),
    Entities:  require('./server/components/entities'),
    Session:   require('./server/components/session'),
    Webserver: require('./server/components/webserver')

};

class RecipeFinder {

    /**
     * Constructor
     */
     constructor() {

        this.log = require('winston');
        this.dir = __dirname;

        this.config    = {};
        this.entity    = {};
        this.session   = {};
        this.webserver = {};

     }

     /**
      * Start application
      */
     start() {

        var log = this.log;

        log.info('Starting server ...');

        // instantiate components
        this.config    = new Component.Config();
        this.entity    = new Component.Entities();
        this.session   = new Component.Session();
        this.webserver = new Component.Webserver();

        // start components
        require('bluebird').coroutine(function*(app) {

            var success = yield app.config.load();

            // abort startup if config was not successfully loaded
            if (!success)
                return;

            var webconfig = app.config.get('webserver');

            if (!webconfig)
                log.warn('No server configuration was defined in config.yml, using defaults.');
              
            yield app.entity.initialize();
            yield app.webserver.start(webconfig);

        })(this).catch(log.error);

     }

}

global.app = new RecipeFinder();
app.start();
