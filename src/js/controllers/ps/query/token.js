/**
 * Created by eric on 16/2/26.
 */
app.controller('TokenController', ['$scope', '$http', 'toaster', 'apiService', function($scope, $http, toaster, apiService) {
    $scope.config = {};

    if(!apiService.initialized()) {
        apiService.init();
        setTimeout(function(){
            $scope.config.servers = apiService.getServerNames();
        }, 100);
    } else {
        $scope.config.servers = apiService.getServerNames();
    }


}]);