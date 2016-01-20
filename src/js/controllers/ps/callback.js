'use strict';

app.controller('CallbackController', ['$scope', '$state', 'toaster', function($scope, $state, toaster) {
	$scope.api = {};

	$scope.done = function() {
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