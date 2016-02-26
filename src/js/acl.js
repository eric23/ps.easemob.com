'use strict';
/**
 *  Module
 *
 * Description
 */
angular.module('acl', []).
service('aclService', ['$http', '$state', '$cookies',
    function($http, $state, $cookies) {
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
                        $cookies['easemob_ps_login'] = new Date().getTime() + 1000*60*60;
                        $cookies['easemob_ps_user'] = self.currentUser;
                        return true;
                    }
                }

                return false;
            } else {
                throw new Error('Permission file is not loaded successfully.');
            }
        };

        this.logined = function() {
            if(self.isLogin) {
                return true;
            } else {
                var expires = $cookies['easemob_ps_login'];
                if(expires && expires > new Date().getTime()) {
                    self.login = true;
                    self.currentUser = $cookies['easemob_ps_user'];
                    return true;
                }
                else {
                    return false;
                }
            }
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