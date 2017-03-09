/**
 * Component class for managing config values
 */

"use strict";

var Promise = require('bluebird');
var yaml    = require('js-yaml');
var fs      = require('fs');
var path    = require('path');

fs = Promise.promisifyAll(fs);

class Config {

    /**
     * Constructor
     */
    constructor() {
        this.values = {};
    }

    /**
     * Get an item from the config by key
     * @param key
     * @returns {*}
     */
    get(key) {
        if (key in this.values)
            return this.values[key];
        return null;
    }

    /**
     * Start component, load in values from config file
     * @returns {Promise.<boolean>}
     */
    load() {

        var log = app.log;

        return Promise.coroutine(function*(config) {

            var filename = path.resolve(__dirname, '..', '..', 'config.yml');

            try {
                yield fs.statAsync(filename);
            } catch (e) {
                log.error('./config.yml does not exist.');
                return false;
            }

            try {
                var yamlData = yield fs.readFileAsync(filename);
            } catch (e) {
                log.error('./config.yml is not readable.');
                return false;
            }

            try {
                config.values = yaml.load(yamlData);
            } catch (e) {
                log.error(`Failed parsing ./config.yml: ${e.message}`);
                return false;
            }

            log.info('Config successfully loaded.');
            return true;

        })(this).catch(log.error);

    }

    /**
     * Set an item in the config (temporarily, this won't get saved)
     * @param {string} key    the key to store against
     * @param {*}      value  a value of any type to store
     */
    set(key, value) {
        this.values[key] = value;
    }

}

module.exports = Config;