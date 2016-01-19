'use strict';

app.controller('LogStoreController', ['$scope', '$state', 'toaster', function($scope, $state, toaster) {
	$scope.data = {};

	$scope.done = function() {
		console.log($scope.data.email);
		console.log($scope.data.url);
		console.log($scope.data.age);

		$scope.success();
		$scope.error('Server Internal Error!');
	};

	$scope.success = function() {
		$scope.steps.percent = 100;
		toaster.pop({
			type: 'success',
			title: '操作提示',
			body: '服务开通成功!',
			onHideCallback: function(){
				$state.reload();
			}
		});
	}

	$scope.error = function(e) {
		toaster.pop({
			type: 'error',
			title: '操作提示',
			body: '服务开通失败，错误信息：' + e
		});
	}
}]);