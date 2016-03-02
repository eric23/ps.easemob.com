/**
 * Created by eric on 16/2/26.
 */
app.controller('GroupController', ['$scope', '$http', 'toaster', 'apiService', function($scope, $http, toaster, apiService) {
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
    				if(response.data.access_token) {
                        var access_token = response.data.access_token;

                        $http({
                            url: $scope.config.server + '/' + $scope.config.org + '/' + $scope.config.app + '/chatgroups/' + $scope.config.group,
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + access_token
                            }
                        }).then(function success(response) {
                            if(response.data.data && response.data.data.length === 1) {
                                var list = response.data.data[0].affiliations;
                                if(list) {
                                    $scope.steps.percent = 100;
                                    $scope.response = JSON.stringify(list, undefined, 2);

                                    for(var i in list) {
                                        var user = (list[i]['member'] || list[i]['owner']);
                                        if(user === $scope.config.user) {
                                            toaster.pop({
                                                type: 'success',
                                                title: '提示',
                                                body: '用户存在于该群组中!'
                                            });
                                            return;
                                        }
                                    }

                                    toaster.pop({
                                        type: 'warning',
                                        title: '提示',
                                        body: '用户不存在于该群组中!'
                                    });
                                }
                            }
                        }, error);
                    }
    			}, error);
    		}
    	}, error);
    };

    function error(msg) {
        $scope.response = JSON.stringify(msg, undefined, 2);
        toaster.pop({
            type: 'error',
            title: '提示',
            body: '操作失败，错误信息：' + msg.status
        });
    }
}]);