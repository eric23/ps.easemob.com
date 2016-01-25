'use strict';
/**
 *  Module
 *
 * Description
 */
angular.module('api', []).
service('apiService', ['$http',
    function($http) {
        var self = this;
        var __not_initialized = 'The configuration file had not been loaded yet or with error.';

        this.configFile = 'js/api.json';
        this.config = {};
        this.loaded = false;
        this.currentApi = {};

        this.init = function() {
            $http.get(self.configFile)
                .success(function(data, status, headers, config) {
                    if (isValidConfig(data)) {
                        self.config = data;
                        self.loaded = true;
                    } else {
                        throw new Error('API configuration is invalid: ' + data);
                    }
                })
                .error(function(data, status, headers, config) {
                    throw new Error(data);
                });
        };

        this.initialized = function() {
            return self.loaded;
        };

        this.getToken = function() {
            if (self.loaded) {
                return self.config.token;
            } else {
                throw new Error(__not_initialized);
            }
        };

        this.getServerNames = function() {
            if (self.loaded) {
                var names = [];
                for (var i = 0; i < self.config.servers.length; i++) {
                    names.push(self.config.servers[i].name);
                }

                return names;
            } else {
                throw new Error(__not_initialized);
            }
        };

        this.getApiGroupNames = function() {
            if (self.loaded) {
                var names = [];
                for (var i = 0; i < self.config.services.length; i++) {
                    names.push(self.config.services[i].group);
                }

                return names;
            } else {
                throw new Error(__not_initialized);
            }
        };

        this.getApiNames = function(group) {
            if (is.not.string(group) || is.empty(group)) {
                throw new Error('Argument group should not be null or empty.');
            }

            if (self.loaded) {
                var apis = [];

                for (var i = 0; i < self.config.services.length; i++) {
                    if (self.config.services[i].group === group) {
                        apis = self.config.services[i].apis;
                        break;
                    }
                }

                return apis;
            } else {
                throw new Error(__not_initialized);
            }
        };

        this.getApi = function(group, api) {
            if (is.not.string(group) || is.empty(group)) {
                throw new Error('Argument group should not be null or empty.');
            }
            if (is.not.string(api) || is.empty(api)) {
                throw new Error('Argument api should not be null or empty.');
            }

            if (self.loaded) {
                var services = self.config.services;

                for (var i = 0; i < services.length; i++) {
                    if (services[i].group === group) {
                        for (var j = 0; j < services[i].apis.length; j++) {
                            if (services[i].apis[j].name === api) {
                                return services[i].apis[j];
                            }
                        }
                        break;
                    }
                }

                return null;
            } else {
                throw new Error(__not_initialized);
            }
        };

        this.getCurrentApi = function() {
            return self.currentApi;
        };

        this.setCurrentApi = function(api) {
            if (is.object(api) && is.not.empty(api)) {
                self.currentApi = api;
            } else {
                throw new Error('Argument api could not be empty.');
            }
        };

        this.releaseCurrentApi = function() {
            self.currentApi = {};
        };

        this.execute = function(apiDef, apiData) {
            if (is.not.object(apiData) || is.empty(apiData)) {
                throw new Error('API could not be executed with empty data.');
            }

            if (isValidApi(apiDef)) {
                var target = findTarget(apiData);
                var reqMethod = findMethod(apiData);
                var reqHeader = findHeader(apiData);
                var reqParameter = findParameter(apiData);
                var reqBody = findBody(apiData);

                var httpPromise = $http({
                    url: target,
                    method: reqMethod,
                    body: reqBody,
                    headers: reqHeader,
                    params: reqParameter
                });
                return httpPromise;
            } else {
                throw new Error('API definition is invalid: ' + apiDef);
            }
        };

        this.executeCurrentApi = function(apiData) {
            return self.execute(self.getCurrentApi, apiData);
        };

        function isValidConfig(config) {
            var struct = is.object(config) && is.not.empty(config) && is.string(config.token) && is.not.empty(config.token) && is.array(config.servers) && is.array(config.services);
            console.log('struct validation passed: ' + struct);

            var servers = true;
            if (struct && is.not.empty(config.servers)) {
                for (var i = 0; i < config.servers.length; i++) {
                    var server = config.servers[i];
                    servers = servers && is.object(server) && is.not.empty(server) && is.url(server.name);

                    if (!servers) {
                        return false;
                    }
                }
            }
            console.log('servers validation passed: ' + servers);

            var services = true;
            if (servers && is.not.empty(config.services)) {
                for (var i = 0; i < config.services.length; i++) {
                    var service = config.services[i];
                    services = services && is.object(service) && is.not.empty(service) && is.string(service.group) && is.not.empty(service.group) && is.array(service.apis);

                    if (!services) {
                        return false;
                    }

                    for (var j = 0; j < service.apis.length; j++) {
                        var api = service.apis[j];
                        services = services && isValidApi(api);
                    }
                }
            }

            if (services) {
                console.log('services validation passed: ' + services);
            }

            return services;
        }

        function isValidApi(api) {
            var result = is.object(api) && is.not.empty(api) && is.string(api.name) && is.not.empty(api.name) && is.string(api.uri) && is.not.empty(api.uri) && is.string(api.method) && is.not.empty(api.method) && is.boolean(api.auth);

            if (!result) {
                return false;
            }

            if (is.array(api.body) && is.not.empty(api.body)) {
                for (var k = 0; k < api.body.length; k++) {
                    var field = api.body[k];
                    result = result && is.string(field.property) && is.not.empty(field.property) && is.string(field.dtype) && is.not.empty(field.dtype) && is.boolean(field.required);

                    if (!result) {
                        return false;
                    }
                }
            }

            result = result && is.existy(api.params) ? is.object(api.params) && is.not.empty(api.params) : true;

            return result;
        }

        function findTarget(data) {
            var server, uri;

            if (is.existy(data.server) && is.existy(data.uri)) {
                server = data.server;
                uri = data.uri;
            } else {
                throw new Error('Service target could not be found in your data, it must contain the elements named [server] and [uri].');
            }


            return server + uri;
        }

        function findMethod(data) {
            var method;

            if (is.existy(data.method)) {
                method = data.method;
            } else {
                throw new Error('Request method could not be found in your data, it must contain the element named [method].');
            }

            return method;
        }

        function findHeader(data) {
            var header = {};

            if (is.existy(data.header)) {
                if (is.object(data.header) && is.not.empty(data.header)) {
                    header = data.header;
                } else {
                    throw new Error('Request header could not be empty if it exists.');
                }
            }

            return header;
        }

        function findParameter(data) {
            var params = {};

            if (is.existy(data.params)) {
                if (is.object(data.params) && is.not.empty(data.params)) {
                    params = data.params;
                } else {
                    throw new Error('Request params could not be empty if it exists.');
                }
            }

            return params;
        }

        function findBody(data) {
            var body = {};

            if (is.existy(data.body)) {
                if (is.object(data.body) && is.not.empty(data.body)) {
                    body = data.body;
                } else {
                    throw new Error('Request body could not be empty if it exists.');
                }
            }

            return body;
        }
    }
]);