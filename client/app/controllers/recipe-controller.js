/**
 * Controller to manage recipe detail page
 */
module.controller('RecipeCtrl', function($scope, $http, $routeParams) {

    $scope.recipe   = {};
    $scope.notFound = false;

    /**
     * Load recipe details from the server
     */
    $scope.loadRecipe = function() {

        $scope.isLoading = true;
        $scope.isStarred = false;

        $http.get(
            
            '/ajax/recipe/load/' + $routeParams.recipeId
        
        ).then(function(response) {
            
            $scope.isLoading = false;
            var data = response.data;

            console.log(response.data);

            if (data.status != 'ok')
                return console.error(data.message);

            if (Object.keys(data.recipe).length)
                $scope.recipe = data.recipe;
            else
                $scope.notFound = true;
            
        }).catch(function(data, status) {
            console.error(data);
            $scope.isLoading = false;
        });

    };

    /**
     * Mark recipe as 'starred'
     */
    $scope.starRecipe = function() {

        $http.get(
            
            '/ajax/recipe/star/' + $routeParams.recipeId
        
        ).then(function(response) {
            
            var data = response.data;

            if (data.status != 'ok')
                return console.error(data.message);

            $scope.recipe.recipeIsStarred = true;
            
        }).catch(function(data, status) {
            console.error(data);
        });
    };

    /**
     * Unmark recipe as 'starred'
     */
    $scope.unstarRecipe = function() {

        $http.get(
            
            '/ajax/recipe/unstar/' + $routeParams.recipeId
        
        ).then(function(response) {
            
            var data = response.data;

            if (data.status != 'ok')
                return console.error(data.message);

            $scope.recipe.recipeIsStarred = false;
            
        }).catch(function(data, status) {
            console.error(data);
        });
    };

    if ($routeParams.recipeId) 
        $scope.loadRecipe();
    else
        $scope.notFound = true;

});