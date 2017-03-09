/**
 * Controller to manage search requests
 */
module.controller('SearchCtrl', function($scope, $http, localStorageService) {

    // slider configuration
    $scope.slider = {
        options: {
            floor: 0,
            ceil: 60,
            onChange: function(id) {
                $scope.updateResults();
            }
        }
    };

    // set default filter values
    $scope.defaultFilters = {
        recipe:      '',
        ingredients: '',
        cookingTime: {
            min: 0,
            max: 60
        },
        starred: false
    };

    $scope.results = [];

    /**
     * Somewhat dubious (but working) method for deep cloning an object
     * without having to include the whole of lodash just to use _.cloneDeep()
     */
    $scope.cloneObject = function(originalObject) {
        return JSON.parse(JSON.stringify(originalObject));
    };

    /**
     * Helper function to determine if filtering is currently being
     * applied to the search
     * @returns {boolean}
     */
    $scope.isFiltered = function() {
        return !($scope.filters === $scope.defaultFilters); 
    }

    /**
     * Query the server for results when the search query changes
     */
    $scope.updateResults = function() {

        $scope.isLoading = true;

        $http.post('/ajax/recipe/search', {
            filters: $scope.filters
        }).then(function(response) {
            
            $scope.isLoading = false;
            var data = response.data;

            if (data.status != 'ok')
                return console.error(data.message);

            $scope.results = data.results;
            console.log($scope.results);

            // save current filter state to local storage
            if (localStorageService.isSupported) {
                localStorageService.set('recipeSearchFilters', $scope.filters);
            }
            
        }).catch(function(data, status) {
            console.error(data);
            $scope.isLoading = false;
        });

    };

    $scope.filters = $scope.cloneObject($scope.defaultFilters);

    // if local storage supported and we have saved search filters,
    // set as current search filters - allows user to return to previous search 
    // from the recipe page
    if (localStorageService.isSupported) {
        
        var filters = localStorageService.get('recipeSearchFilters');
        if (filters)
            $scope.filters = filters;

    }

    // run an initial search when the page loads
    $scope.updateResults();

});
