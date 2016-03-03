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

    $scope.done = function() {
    	$http({
    		url: $scope.config.server + '/' + $scope.config.org + '/' + $scope.config.app + '/credentials',
    		mehtod: 'GET',
    		headers: {
    			'Content-Type': 'application/json',
    			'Authorization': 'Bearer ' + apiService.getToken($scope.config.server)
    		}
    	}).then(function success(response) {
    		if(response.data.credentials) {
    			var clientId = response.data.credentials.client_id;
    			var clientSecret = response.data.credentials.client_secret;

    			$http({
    				url: $scope.config.server + '/' + $scope.config.org + '/' + $scope.config.app + '/token',
    				method: 'POST',
    				data: {
    					'grant_type': 'client_credentials',
    					'client_id': clientId,
    					'client_secret': clientSecret
    				}
    			}).then(function success(response) {
    				$scope.steps.percent = 100;
                    $scope.response = JSON.stringify(response.data, undefined, 2);
                    toaster.pop({
                        type: 'success',
                        title: '提示',
                        body: '操作成功!'
                    });
    			}, function error(msg) {
    				$scope.response = JSON.stringify(msg, undefined, 2);
                    toaster.pop({
                        type: 'error',
                        title: '提示',
                        body: '操作失败，错误信息：' + msg.status
                    });
    			});
    		}
    	}, function error(msg) {
    		$scope.response = JSON.stringify(msg, undefined, 2);
                toaster.pop({
                    type: 'error',
                    title: '提示',
                    body: '操作失败，错误信息：' + msg.status
                });
    	});
    };

	$scope.exit = function () {
		$state.reload();
	};
}]);