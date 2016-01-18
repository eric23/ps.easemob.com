app.controller('Function01Controller', ['$scope', '$http', '$translate', function($scope, $http, $translate) {
	$scope.token = '';
	$scope.data = [];
	$scope.cursors = [];

	$scope.pagingOptions = {
        pageSizes: [2, 5, 10],
        pageSize: 2,
        currentPage: 1,
    };

    $scope.totalRecordCount = 0;
    $scope.hasPre = false;
    $scope.hasNext = false;

    $scope.getToken = function () {
    	if(!$scope.token || $scope.token.length == 0){
    		var req = {
				method: 'POST',
				url: 'https://a1.easemob.com/ericyj/imgeek/token',
				headers: {
					'Content-Type': 'application/json'
				},
				data: {"grant_type":"client_credentials","client_id":"YXA6QzvXcLK4EeWF_vX5Y3JbgQ","client_secret":"YXA6Z1ITZS1fovwN4mqQNXAi5ovb-1k"}
			};

			$http(req)
			.success(function(data){
	        	$scope.token = data.access_token;
			});
    	}
    };

    $scope.getUsers = function(page) {
    	$scope.getToken();
    	setTimeout(function(){
    		if(!$scope.token || $scope.token.length == 0){
    			// TODO
    			alert('no token');
    			return;
    		}

	    	var q = '?limit=' + $scope.pagingOptions.pageSize;
	    	if($scope.cursors && $scope.cursors.length > 0) {
	    		q = q + '&cursor=' + $scope.cursors[page-1];
	    	} 

	    	var req = {
				method: 'GET',
				url: 'https://a1.easemob.com/ericyj/imgeek/users' + q,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + $scope.token
				}
			};

			$http(req)
			.success(function(data){
		    	$scope.data = data.entities;
		    	$scope.totalRecordCount = data.entities.length;
		    	if(data.cursor && data.cursor !== '') {
		    		$scope.cursors[page-1] = data.cursor;
		    		$scope.hasNext = $scope.pagingOptions.pageSize === data.count;
		    	}
			});
    	}, 1000);
    };

    $scope.movePre = function() {
    	if($scope.hasPre){
    		$scope.pagingOptions.currentPage--;
    	}
    };

    $scope.moveNext = function() {
    	if($scope.hasNext){
    		$scope.pagingOptions.currentPage++;
    	}
    };

    $scope.getUsers($scope.pagingOptions.currentPage);
    
    $scope.$watch('pagingOptions.pageSize', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.cursor = [];
          $scope.pagingOptions.currentPage = 1;
          $scope.getUsers($scope.pagingOptions.currentPage);
        }
    }, true);
    $scope.$watch('pagingOptions.currentPage', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.getUsers(oldVal);
        }
    }, true);
}]);