app = angular.module('RecipeFinder', [
    'RecipeFinder.controllers'
]);

module = angular.module('RecipeFinder.controllers', [
	'ngRoute',	         // angular routing
	'rzModule',          // range slider 
	'LocalStorageModule' // local storage
]);

app.config([
    '$httpProvider',
    function($httpProvider) {
        // Expose XHR requests to server
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    }
]);

app.config([
    '$httpProvider',
    '$locationProvider',
    function($httpProvider, $locationProvider) {
        // Expose XHR requests to server
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        // enable HTML5 mode routing
        $locationProvider.html5Mode(true);
    }
])

app.config(function($routeProvider) {

    $routeProvider
        .when("/", {
            templateUrl: "/app/views/search.html",
            controller:  "SearchCtrl"
        })
        .when("/recipe/:recipeId", {
            templateUrl: "/app/views/recipe.html",
            controller:  "RecipeCtrl"
        });

});