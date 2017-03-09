/**
 * Manager object for ajax requests from web client
 */

"use strict";

var coroutine = require('bluebird').coroutine;

module.exports = class AjaxAPI {
    
    /**
     * Retrieve an ingredient list for an array of recipe ids
     * @param   {Array}  recipeIds  an array of recipe ids to retrieve ingredients for
     * @returns {Object}
     */
    getRecipeIngredients(recipeIds) {

        var results = {};

        return coroutine(function*() {

            var model = app.entity.model.recipeIngredient;

            var ingredients = yield model.findAll({
                where: {
                    recipeId: recipeIds
                }
            });

            for (let ingredient of ingredients) {
                if (!(ingredient.recipeId in results))
                    results[ingredient.recipeId] = [];
                results[ingredient.recipeId].push(ingredient.ingredient);
            }

            return results;

        })().catch(app.log.error);

    }

    /**
     * Load a recipe from the database
     */
    loadRecipe(request, response) {
        
        return coroutine(function*() {

            var recipeId    = request.params.recipeId;
            var recipeModel = app.entity.model.recipe;
            var userModel   = app.entity.model.user;
            var db          = app.entity.db;
            var record;

            var query = {
                where: {
                    recipeId: recipeId
                },
                include: [{
                    model: app.entity.model.recipeIngredient,
                    where: {
                        recipeId: db.col('recipe.recipeId'),
                    },
                    required: false
                }]
            };

            // if user logged in, attempt to get user id from supplied session id
            if ('sessionId' in request.cookies) {

                var user = yield userModel.findOne({
                    where: {
                        sessionId: request.cookies.sessionId
                    }
                });

                // add a join onto the main query to determine if user has starred the recipe
                if (user) 
                    query.include.push({
                        model: app.entity.model.userStarredRecipe,
                        where: {
                            recipeId: db.col('recipe.recipeId'),
                            userId:   user.userId 
                        },
                        required: false
                    });

            }

            // query the recipe
            try {
                record = yield recipeModel.findOne(query);
            } catch (e) {
                result = {
                    status: 'error',
                    message: e.message
                };
            }

            var ingredients = record.recipeIngredients.map(function(ingredient) {
                return {
                    quantity:   ingredient.quantity,
                    ingredient: ingredient.ingredient
                };
            });

            var result = record ? {
                status: 'ok',
                recipe: {
                    recipeId:          record.recipeId,
                    recipeTitle:       record.recipeTitle,
                    recipeCookingTime: record.recipeCookingTime,
                    recipeIsStarred:   ('userStarredRecipes' in record && record.userStarredRecipes.length ? true : false),
                    recipeIngredients: ingredients
                }
            } : {
                status: 'ok',
                recipe: {}
            };

            response.send(JSON.stringify(result));

        })().catch(app.log.error);

    }

    /**
     * Search recipes in the database
     */
    searchRecipes(request, response) {

        return coroutine(function*(ajax) {

            var result = {};

            if ('filters' in request.body) {

                var filters = request.body.filters;
                var model   = app.entity.model.recipe;
                var db      = app.entity.db;

                var query = {
                    where: {
                        recipeTitle: {
                            $like: `%${filters.recipe}%`
                        },
                        recipeCookingTime: {
                            $between: [filters.cookingTime.min, filters.cookingTime.max]
                        }
                    },
                    include: []
                };

                if (filters.ingredients != '') {
                    query.include.push({
                        model: app.entity.model.recipeIngredient,
                        where: {
                            recipeId: db.col('recipe.recipeId'),
                            ingredient: {
                                $like: `%${filters.ingredients}%`
                            }
                        },
                        required: true
                    });
                }

                // add join onto userStarredRecipe, for filtering starred recipes
                query.include.push({
                    model: app.entity.model.userStarredRecipe,
                    where: {
                        recipeId: db.col('recipe.recipeId')
                    },
                    required: filters.starred
                });

                try {

                    var results   = yield model.findAll(query);
                    var recipeIds = [];
                    
                    for (let r of results)
                        recipeIds.push(r.recipeId);

                    // was proving difficult to get Sequelize to search by ingredient, but also return all the
                    // ingredients for each recipe - so we do an inner join in the main query to search by ingredient,
                    // then this function runs a second to query to retrieve the ingredients 
                    var ingredients = yield app.webserver.ajax.getRecipeIngredients(recipeIds);

                    result = {
                        status:  'ok',
                        results: results.map(function(result) {
                            
                            var recipeIngredients = [];

                            if (result.recipeId in ingredients)
                                recipeIngredients = ingredients[result.recipeId];
                            
                            return {
                                recipeId:          result.recipeId,
                                recipeTitle:       result.recipeTitle,
                                recipeCookingTime: result.recipeCookingTime,
                                recipeIsStarred:   ('userStarredRecipes' in result && result.userStarredRecipes.length),
                                recipeIngredients: recipeIngredients.join(', ')
                            };

                        })
                    };

                } catch (e) {
                    result = {
                        status: 'error',
                        message: e.message
                    };
                }

            } else {
                result = {
                    status:  'error',
                    message: 'No data to save'
                };
            }

            response.send(JSON.stringify(result));

        })(this).catch(app.log.error);

    }

    /**
     * Save agent config to the database
     */
    starRecipe(request, response) {

        return coroutine(function*() {

            var result    = {};
            var recipeId  = request.params.recipeId;
            var userModel = app.entity.model.user;

            var user = yield userModel.findOne({
                where: {
                    sessionId: request.cookies.sessionId
                }
            });

            if (user) {

                var userId       = user.userId;
                var starredModel = app.entity.model.userStarredRecipe;

                yield starredModel.upsert({
                    userId:   userId,
                    recipeId: recipeId
                });

                result = {
                    status: 'ok'
                };

            } else {
                result = {
                    status:  'error',
                    message: 'user not found'
                }
            }

            response.send(JSON.stringify(result));


        })().catch(app.log.error);        

    }

    /**
     * Search for agents in the database 
     */
    unstarRecipe(request, response) {
        
        return coroutine(function*() {

            var result    = {};
            var recipeId  = request.params.recipeId;
            var userModel = app.entity.model.user;

            var user = yield userModel.findOne({
                where: {
                    sessionId: request.cookies.sessionId
                }
            });

            if (user) {

                var userId       = user.userId;
                var starredModel = app.entity.model.userStarredRecipe;

                yield starredModel.destroy({
                    where: {
                        userId:   userId,
                        recipeId: recipeId
                    }
                });

                result = {
                    status: 'ok'
                };

            } else {
                result = {
                    status:  'error',
                    message: 'user not found'
                }
            }

            response.send(JSON.stringify(result));


        })().catch(app.log.error);   

    }

}
