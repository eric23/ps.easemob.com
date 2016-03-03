/**
 * Created by eric on 16/2/26.
 */
app.controller('LogController', ['$scope', '$http', '$state', 'toaster', 'apiService', function($scope, $http, $state, toaster, apiService) {
    $scope.config = {
        date: '3',
        onlyone: 'n',
        pages: '10'
    };

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
                        var cursor = undefined;
                        var ql = buildQL($scope.config.date);
                        loopQuery(access_token, ql, cursor, 1, []);
                    }
    			}, error);
    		}
    	}, error);
    };

    $scope.exit = function () {
        $state.reload();
    };

    function error(msg) {
        $scope.response = JSON.stringify(msg, undefined, 2);
        toaster.pop({
            type: 'error',
            title: '提示',
            body: '操作失败，错误信息：' + msg.status
        });
    }

    function buildQL(scope) {
        var ql = 'select * where ';
        var start;
        var today = new Date().getTime();
        if(scope === '1') {
            start = today - 1 * 24 * 60 * 60 * 1000;
        } else if(scope === '3'){
            start = today - 3 * 24 * 60 * 60 * 1000;
        } else if(scope === '7'){
            start = today - 7 * 24 * 60 * 60 * 1000;
        } else if(scope === '15'){
            start = today - 15 * 24 * 60 * 60 * 1000;
        } else if(scope === '30') {
            start = today - 30 * 24 * 60 * 60 * 1000;
        }

        ql += 'timestamp < ' + today + ' and timestamp > ' + start;

        return ql;
    }

    function match(keyword, msg) {
        var body;
        try{
            body = msg.payload.bodies[0];
        } catch (e) {
            return null;
        }

        if(body.type === 'txt') {
            if(body.msg.indexOf(keyword) > -1) {
                return {
                    from: msg.from,
                    to: msg.to,
                    timestamp: msg.timestamp,
                    msg_id: msg.msg_id,
                    chat_type: msg.chat_type,
                    msg: body.msg
                };
            }
        }

        return null;
    }

    function loopQuery(access_token, ql, cursor, count, result) {
        var foundOrError = false;

        $http({
            url: $scope.config.server + '/' + $scope.config.org + '/' + $scope.config.app + '/chatmessages',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token
            },
            params: {
                limit: 100,
                ql: ql,
                cursor: cursor ? cursor : ''
            }
        }).then(function success(response) {
            if(response.data){
                var list = response.data.entities;
                cursor = response.data.cursor;
                var matched;
                var tempMatched = [];

                if(list) {
                    for(var i in list) {
                        matched = match($scope.config.keyword, list[i]);
                        if(matched) {
                            tempMatched.push(matched);

                            if($scope.config.onlyone === 'y') {
                                foundOrError = true;
                                break;
                            }
                        }
                    }
                }
                result = result.concat(tempMatched);

                if(!foundOrError && cursor && (count <= parseInt($scope.config.pages) || $scope.config.pages === '-1')) {
                    loopQuery(access_token, ql, cursor, count+1, result);
                } else {
                    $scope.steps.percent = 100;
                    $scope.response = JSON.stringify(result, undefined, 2);
                    toaster.pop({
                        type: result.length == 0 ? 'warning' : 'success',
                        title: '提示',
                        body: '搜索完成,共找到('+ result.length +')条记录!'
                    });
                }
            }
        }, error);
    }

}]);