'use strict';
/**
 *  Module
 *
 * Description
 */
angular.module('acl', []).
service('aclService', ['$http', '$state',
    function($http, $state) {
        var self = this;
        this.isLogin = false;
        this.currentUser;
        this.users;

        this.init = function() {
            $http.get('js/permission.json')
                .success(function(data) {
                    self.users = data.users;
                });
        };
        this.init();


        this.login = function(user, password) {
            if (is.array(self.users) && is.not.empty(self.users)) {
                for (var i = 0; i < self.users.length; i++) {
                    var u = self.users[i];
                    if (u.user === user && u.password === password) {
                        self.isLogin = true;
                        self.currentUser = user;
                        return true;
                    }
                }

                return false;
            } else {
                throw new Error('Permission file is not loaded successfully.');
            }
        };

        this.logined = function() {
            return self.isLogin;
        };

        this.logout = function() {
            self.isLogin = false;
            self.currentUser = undefined;
            $state.go('login');
        };
    }
]);

app.controller('LoginCtrl', ['$scope', '$state', 'aclService',
    function($scope, $state, aclService) {
        $scope.login = function() {
            var result = aclService.login($scope.name, $scope.password);
            if (!result) {
                $scope.error = 'Invalid user name or password!';
            } else {
                $state.go('app.ps.price');
            }
        };
    }
]);