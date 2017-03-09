"use strict";

var _            = require('lodash');
var Sequelize    = require('sequelize');
var coroutine    = require('bluebird').coroutine;
var path         = require('path');
var EntityLoader = require('./entity/loader');

module.exports = class Entities {

    constructor() {
        
        this.db    = null;
        this.model = {};
        this.load  = new EntityLoader();

    }

    /**
     * Define entity and sync
     * @param   {string} name        entity name
     * @param   {object} attributes  entity fields
     * @param   {object} options     options to set on the entity
     * @returns {Promise}
     */
    create(name, attributes, options) {

        // todo: check if already defined or isReserved

        // disable creation of createdAt / updatedAt fields, unless explicitly enabled
        if (!('timestamps' in options))
            options.timestamps = false;

        // db.define will modify attributes object once passed to it, so deep copy
        // beforehand for updating db records.
        var fields = _.cloneDeep(attributes);

        // define the model
        this.model[name] = this.db.define(name, attributes, options);

        // sync the model
        return this.model[name].sync({force: true});

    }

    /**
     * Determine if entity exists
     * @param  {string} name  name of the entity to check
     * @return {boolean}
     */
    exists(name) {
        return name in this.model;
    }

    /**
     * Initialize entities
     */
    initialize() {

        return coroutine(function*(entity) {
            
            var config = app.config.get('db');
            var log    = app.log;
            
            if (!config)
                return log.error('Unable to connect to database. No db settings found in config.');

            var logger = () => null;
            
            if ('logging' in config) {

                switch (true) {
                    
                    case config.logging === true:
                        //logger = log;
                        break;
                    
                    case typeof config.logging == 'string':
                        // @todo  implement query logging to separate file
                        log.warn('Query logging to a separate file currently unimplemented.');
                        break;
                    
                }
                
            }
            
            // initialize db connection
            entity.db = new Sequelize(config.name, config.user, config.pass, {

                host:    'host' in config ? config.host : 'localhost',
                dialect: 'type' in config ? config.type : 'sqlite',

                pool:    'pool' in config ? config.pool : {
                    max:  50,
                    min:  0,
                    idle: 10000
                },

                // SQLite only
                storage: path.resolve(app.dir, 'storage' in config ? config.storage : 'default.db'),

                //logging: logger

            });
            
            // alias db models
            entity.model = entity.db.models;

            // load data models and sample data - for testing purposes, this re-creates the database
            // and populates it with sample data each time you start the application
            yield entity.load.fromDirectory(path.resolve(app.dir, 'server', 'models'));

            entity.model.recipe.hasMany(entity.model.userStarredRecipe, { foreignKey: 'recipeId'});
            entity.model.userStarredRecipe.hasMany(entity.model.recipe, { foreignKey: 'recipeId'});

            entity.model.user.hasMany(entity.model.userStarredRecipe, { foreignKey: 'userId'});
            entity.model.userStarredRecipe.hasMany(entity.model.user, { foreignKey: 'userId'});

            entity.model.recipe.hasMany(entity.model.recipeIngredient, { foreignKey: 'recipeId'});
            entity.model.recipeIngredient.hasMany(entity.model.recipe, { foreignKey: 'recipeId'});

            yield entity.model.user.sync({force: true});
            yield entity.model.userStarredRecipe.sync({force: true});
            yield entity.model.recipe.sync({force: true});
            yield entity.model.recipeIngredient.sync({force: true});

            yield entity.load.sampleData(path.resolve(app.dir, 'server', 'sample-data'));

            return true;

        })(this).catch(app.log.error);

    }

}