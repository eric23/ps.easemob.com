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

        this.getToken = function(serverName) {
            if (self.loaded) {
                for(var i=0; i<self.config.servers.length; i++) {
                    if(serverName === self.config.servers[i].name) {
                        return self.config.servers[i].token;
                    }
                }
                console.log('Token was not found with server name:' + serverName);
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
                var target = findTarget(apiDef, apiData);
                var reqMethod = findMethod(apiDef, apiData);
                var reqHeader = findHeader(apiDef, apiData);
                var reqParameter = findParameter(apiDef, apiData);
                var reqBody = findBody(apiDef, apiData);

                console.log('Request: [target=' + target + '] [method=' + reqMethod + '] [header=' + JSON.stringify(reqHeader) + '] [parameter=' + JSON.stringify(reqParameter) + '] [body=' + JSON.stringify(reqBody) + ']');

                var httpPromise = $http({
                    url: target,
                    method: reqMethod,
                    data: reqBody,
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
            var struct = is.object(config) && is.not.empty(config) && is.array(config.servers) && is.array(config.services);
            console.log('struct validation passed: ' + struct);

            var servers = true;
            if (struct && is.not.empty(config.servers)) {
                for (var i = 0; i < config.servers.length; i++) {
                    var server = config.servers[i];
                    servers = servers && is.object(server) && is.not.empty(server);// && is.url(server.name);

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

        function findTarget(def, data) {
            var server, uri;

            if (is.existy(data.server) && is.not.empty(data.server)) {
                server = data.server;
            } else {
                throw new Error('Service server could not be found in your data, it must contain the element named [server].');
            }

            if (is.existy(def.uri) && is.not.empty(def.uri)) {
                uri = def.uri;
            } else {
                throw new Error('Service uri could not be found in your config, it must contain the element named [uri].');
            }

            if (uri.indexOf(':') > -1) {
                if (is.not.existy(data.uri) || is.empty(data.uri)) {
                    throw new Error('Service uri could not be found in your data, it must contain the element named [uri].');
                }

                // transfer the uri
                var paths = uri.split('/');

                for (var i = 0; i < paths.length; i++) {
                    if (paths[i] === '') {
                        continue;
                    }
                    if (paths[i].indexOf(':') === 0) {
                        var path = paths[i].substring(1, paths[i].length);
                        uri = uri.replace(':' + path, data.uri[path]);
                    }
                }
            }

            return server + uri;
        }

        function findMethod(def, data) {
            var method;

            if (is.existy(def.method)) {
                method = def.method;
            } else if (is.existy(data.method)) {
                method = data.method;
            } else {
                throw new Error('Request method could not be found in your config or data, it must contain the element named [method].');
            }

            return method;
        }

        function findHeader(def, data) {
            var header = {};

            if (is.existy(data.header)) {
                if (is.object(data.header) && is.not.empty(data.header)) {
                    header = data.header;
                } else {
                    throw new Error('Request header could not be empty if it exists.');
                }
            }

            var needAuth = def.auth || false;

            if (needAuth && is.not.existy(header.Authorization)) {
                data.token = self.getToken(data.server);

                if (is.not.existy(data.token) || is.empty(data.token)) {
                    throw new Error('Request token could not be found in your data, it must contain the element named [token].');
                }
                header.Authorization = 'Bearer ' + data.token;
            }

            return header;
        }

        function findParameter(def, data) {
            var params = {};

            if (is.existy(data.params)) {
                if (is.object(data.params) && is.not.empty(data.params)) {
                    params = data.params;
                }
            }

            return params;
        }

        function findBody(def, data) {
            var body = {};

            if (is.existy(data.body)) {
                if (is.object(data.body) && is.not.empty(data.body)) {
                    body = data.body;
                }
            }

            return body;
        }
    }
]).
directive('api', ['$compile', '$state', '$http', 'toaster', 'apiService',
    function($compile, $state, $http, toaster, apiService) {
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: true, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
            // template: '',
            templateUrl: 'tpl/ps/api_template.html',
            replace: true,
            // transclude: true,
            // compile: function(iElm, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            link: function($scope, iElm, iAttrs, controller) {
                var mergedConfig = angular.extend({}, $scope.$eval(iAttrs.apiOptions)); // attr of attrs will be formatted like api-options -> apiOptions

                $scope.config = {
                    apiGroup: mergedConfig['group'],
                    apiName: mergedConfig['name'],
                    api: {},
                    params: {},
                    uriProperties: [],
                    bodyProperties: []
                };

                $scope.api = {
                    uri: {},
                    body: {}
                };

                $scope.render = function() {
                    initParameters();
                    renderPage($scope.config.apiGroup, $scope.config.apiName);
                };

                if (!apiService.initialized()) {
                    apiService.init();
                    setTimeout(function() {
                        $scope.render();
                    }, 100);
                } else {
                    setTimeout(function() {
                        $scope.render();
                    }, 0);
                }

                $scope.done = function() {
                    var validation = $scope.validate();
                    if (!validation.pass) {
                        toaster.pop({
                            type: 'error',
                            title: '提示',
                            body: '操作失败，错误信息：' + validation.error
                        });

                        return;
                    }

                    var promise = apiService.execute($scope.config.api, $scope.api);
                    promise.then(function(obj) {
                        return success(obj.data, obj.status, obj.headers, obj.config, obj.statusText);
                    }, function(obj) {
                        return error(obj.data, obj.status, obj.headers, obj.config, obj.statusText);
                    });
                };

                $scope.exit = function() {
                    $state.reload();
                };

                $scope.validate = function() {
                    var validation = {
                        pass: false
                    };
                    var error = '';

                    // check uri
                    for (var i = 0; i < $scope.config.uriProperties.length; i++) {
                        var uriP = $scope.config.uriProperties[i];
                        if (is.not.string($scope.api.uri[uriP]) || is.empty($scope.api.uri[uriP])) {
                            error += uriP + ' is empty. ';
                        }
                    }

                    // check body
                    if (is.existy($scope.config.api.body)) {
                        for (var i = 0; i < $scope.config.api.body.length; i++) {
                            var bodyP = $scope.config.api.body[i];
                            var dtype = bodyP.dtype;
                            var bodyV = $scope.api.body[bodyP.property];

                            if (bodyP.required && (is.not.existy(bodyV) || is.empty(bodyV))) {
                                error += bodyP.property + ' is empty. ';
                            }

                            switch (dtype) {
                                case 'text':
                                    if (is.existy(bodyV) && is.not.string(bodyV)) {
                                        error += bodyP.property + ' is not a text. ';
                                    }
                                    break;
                                case 'enum':
                                    break;
                                case 'number':
                                    if (is.existy(bodyV) && is.not.number(bodyV)) {
                                        error += bodyP.property + ' is not a number. ';
                                    }
                                    break;
                                case 'url':
                                    if (is.existy(bodyV) && is.not.url(bodyV)) {
                                        error += bodyP.property + ' is not a url. ';
                                    }
                                    break;
                                case 'date':
                                    if (is.existy(bodyV) && is.not.string(bodyV)) {
                                        error += bodyP.property + ' is not a date. ';
                                    }
                                    break;
                                case 'large-text':
                                    if (is.existy(bodyV) && is.not.string(bodyV)) {
                                        error += bodyP.property + ' is not a text. ';
                                    }
                                    break;
                                case 'multi-enum':
                                    break;
                                default:
                                    throw new Error('Unexpected data type of ' + dtype);
                            }
                        }
                    }

                    // check parameters
                    // TODO

                    validation.error = error;
                    validation.pass = is.empty(error);
                    return validation;
                };

                function initParameters() {
                    var initParameters = $scope.$eval(iAttrs.initParams);

                    if (initParameters) {
                        for (var i = initParameters.length - 1; i >= 0; i--) {
                            var from = initParameters[i].from;
                            var to = initParameters[i].to;

                            if (from && to) {
                                var fromValue = $state.params[from];
                                $scope.config.params[to.split('.')[1]] = fromValue;
                                $scope.api[to.split('.')[0]][to.split('.')[1]] = fromValue;
                            }
                        }
                    }
                }

                function renderPage(group, name) {
                    if (is.not.string(group) || is.empty(group)) {
                        throw new Error('Argument group should not be null or empty.');
                    }
                    if (is.not.string(name) || is.empty(name)) {
                        throw new Error('Argument name should not be null or empty.');
                    }

                    $scope.config.servers = apiService.getServerNames();
                    var currentApi = apiService.getApi(group, name);

                    if (is.object(currentApi) && is.not.empty(currentApi)) {
                        apiService.setCurrentApi(currentApi);
                        $scope.config.api = currentApi;
                    } else {
                        throw new Error('API definition [' + name + '] of [' + group + '] could not be found.');
                    }

                    var t1 = renderUIElements(currentApi);
                    var template1 = $compile(t1)($scope);
                    iElm.find('#api_properties').append(template1);
                    console.log('API input elements have been initialized.');

                    var t2 = renderUIOutput($scope.config.uriProperties, $scope.config.bodyProperties);
                    var template2 = $compile(t2)($scope);
                    iElm.find('#api_properties_output').append(template2);
                    console.log('API output elements have been initialized.');
                }

                function renderUIElements(api) {
                    var uri = renderUri(api.uri);
                    var body = renderBody(api.body);
                    var query = renderQuery(api.query);

                    return uri + body + query;
                }

                function renderUIOutput(p1, p2) {
                    p1 = p1 || [];
                    p2 = p2 || [];

                    var template = function(name, part) {
                        return '<div class="form-group">' +
                            '<label class="col-sm-2 control-label" translate="api.' + $scope.config.apiName + '.' + name + '"></label>' +
                            '<div class="col-sm-8">' +
                            '{{api.' + part + '.' + name + '}}' +
                            '</div></div><div class="line line-dashed b-b line-lg pull-in"></div>';
                    };

                    var html = '';
                    for (var i = 0; i < p1.length; i++) {
                        html += template(p1[i], 'uri');
                    }
                    for (var i = 0; i < p2.length; i++) {
                        html += template(p2[i], 'body');
                    }

                    return html;
                }

                function renderUri(uri) {
                    if (!uri) {
                        throw new Error('URI is required of a API schema.');
                    }

                    var html = '';
                    var paths = uri.split('/');
                    for (var i = 0; i < paths.length; i++) {
                        if (paths[i] === '') {
                            continue;
                        }
                        if (paths[i].indexOf(':') === 0) {
                            html += renderInputElement(paths[i].substring(1, paths[i].length), 'text', true, 'uri');
                        }
                    }

                    return html;
                }

                function renderBody(body) {
                    var html = '';

                    if (body) {
                        for (var i = 0; i < body.length; i++) {
                            var element = body[i];
                            if (isParameter(element.property)) {
                                html += renderParamElement(element.property, 'body');
                                continue;
                            }

                            switch (element.dtype) {
                                case 'text':
                                    html += renderInputElement(element.property, 'text', element.required, 'body', element.tip, element.help);
                                    break;
                                case 'enum':
                                    html += renderEnumElement(element.property, element.options, element.required, 'body', element.tip, element.help);
                                    break;
                                case 'number':
                                    html += renderInputElement(element.property, 'number', element.required, 'body', element.tip, element.help);
                                    break;
                                case 'url':
                                    html += renderInputElement(element.property, 'url', element.required, 'body', element.tip ? element.tip : 'http://', element.help);
                                    break;
                                case 'date':
                                    html += renderDateElement(element.property, element.required, 'body', element.tip, element.help);
                                    break;
                                case 'large-text':
                                    html += renderTextarea(element.property, element.required, 'body', element.tip, element.help);
                                    break;
                                case 'multi-enum':
                                    html += renderMultiEnumElement(element.property, element.options, element.required, 'body', element.tip, element.help);
                                    break;
                                default:
                                    throw new Error('Unexpected data type of ' + element.dtype);
                            }
                        }
                    }

                    return html;
                }

                function renderQuery(query) {
                    // TODO
                    return '';
                }

                function renderParamElement(name, part) {
                    if (!name || name === '') {
                        throw new Error('Name of a property could not be null or empty.');
                    }
                    var param = $scope.config.params[name];

                    var template = '<div class="form-group">' +
                        '<label class="col-sm-2 control-label" translate="api.' + $scope.config.apiName + '.' + name + '">' + name + '</label>' +
                        '<div class="col-sm-8">' +
                        '<span ng-model="api.' + part + '.' + name + '" >' + param +
                        '</div>' +
                        '</div>' +
                        '<div class="line line-dashed b-b line-lg pull-in"></div>';

                    return template;
                }

                function isParameter(name) {
                    return $scope.config.params[name];
                }

                function renderInputElement(name, dtype, required, part, tip, help) {
                    if (!name || name === '') {
                        throw new Error('Name of a property could not be null or empty.');
                    }

                    required = required || true;
                    var requiredStr = required ? 'required' : '';
                    tip = tip ? tip : '';
                    dtype = dtype && ['text', 'email', 'password', 'url', 'number'].indexOf(dtype) > -1 ? dtype : 'text';
                    var helpStr = help ? '<span class="help-block m-b-none">' + help + '</span>' : '';

                    if ('uri' === part) {
                        $scope.config.uriProperties.push(name);
                    } else if ('body' === part) {
                        $scope.config.bodyProperties.push(name);
                    } else {
                        throw new Error('Unexpected part type of ' + part);
                    }

                    var template = '<div class="form-group">' +
                        '<label class="col-sm-2 control-label" translate="api.' + $scope.config.apiName + '.' + name + '">' + name + '</label>' +
                        '<div class="col-sm-8">' +
                        '<input type="' + dtype + '" name="' + name + '" placeholder="' + tip + '" class="form-control" ng-model="api.' + part + '.' + name + '" ' + requiredStr + '>' +
                        helpStr +
                        '</div>' +
                        '</div>' +
                        '<div class="line line-dashed b-b line-lg pull-in"></div>';
                    return template;
                }

                function renderEnumElement(name, options, required, part, tip, help) {
                    if (!name || name === '') {
                        throw new Error('Name of a property could not be null or empty.');
                    }

                    if (!options || options.length === 0) {
                        throw new Error('Options of an enum property [name=' + name + '] could not be null or empty.');
                    }

                    required = required || true;
                    var requiredStr = required ? 'required' : '';
                    tip = tip ? tip : '';
                    var helpStr = help ? '<span class="help-block m-b-none">' + help + '</span>' : '';

                    if ('uri' === part) {
                        $scope.config.uriProperties.push(name);
                    } else if ('body' === part) {
                        $scope.config.bodyProperties.push(name);
                    } else {
                        throw new Error('Unexpected part type of ' + part);
                    }

                    var template = '<div class="form-group">' +
                        '<label class="col-sm-2 control-label" translate="api.' + $scope.config.apiName + '.' + name + '">' + name + '</label>' +
                        '<div class="col-sm-8">' +
                        '<select name="' + name + '" placeholder="' + tip + '" class="form-control" ng-model="api.' + part + '.' + name + '" ' + requiredStr + '>';

                    for (var i = 0; i < options.length; i++) {
                        template += '<option>' + options[i] + '</option>';
                    }
                    template += '</select>' + helpStr + '</div></div><div class="line line-dashed b-b line-lg pull-in"></div>';

                    return template;
                }

                function renderDateElement(name, required, part, tip, help) {
                    if (!name || name === '') {
                        throw new Error('Name of a property could not be null or empty.');
                    }

                    required = required || true;
                    var requiredStr = required ? 'required' : '';
                    tip = tip ? tip : '';
                    var helpStr = help ? '<span class="help-block m-b-none">' + help + '</span>' : '';

                    if ('uri' === part) {
                        $scope.config.uriProperties.push(name);
                    } else if ('body' === part) {
                        $scope.config.bodyProperties.push(name);
                    } else {
                        throw new Error('Unexpected part type of ' + part);
                    }

                    var template = '<div class="form-group">' +
                        '<label class="col-sm-2 control-label" translate="api.' + $scope.config.apiName + '.' + name + '">' + name + '</label>' +
                        '<div class="col-sm-8" ng-controller="DatepickerSimpleCtrl">' +
                        '<div class="input-group w-md">' +
                        '<input type="text" name="' + name + '" placeholder="' + tip + '" class="form-control" datepicker-popup="yyyy-MM-dd 00:00:00" is-open="opened" datepicker-options="dateOptions" close-text="Close" mydate ng-model="api.' + part + '.' + name + '" ' + requiredStr + '>' +
                        '<span class="input-group-btn">' +
                        '<button type="button" class="btn btn-default" ng-click="open($event)"><i class="glyphicon glyphicon-calendar"></i></button>' +
                        '</span></div>' +
                        helpStr +
                        '</div>' +
                        '</div>' +
                        '<div class="line line-dashed b-b line-lg pull-in"></div>';
                    return template;
                }

                function renderTextarea(name, required, part, tip, help) {
                    if (!name || name === '') {
                        throw new Error('Name of a property could not be null or empty.');
                    }

                    required = required || true;
                    var requiredStr = required ? 'required' : '';
                    tip = tip ? tip : '';
                    var helpStr = help ? '<span class="help-block m-b-none">' + help + '</span>' : '';

                    if ('uri' === part) {
                        $scope.config.uriProperties.push(name);
                    } else if ('body' === part) {
                        $scope.config.bodyProperties.push(name);
                    } else {
                        throw new Error('Unexpected part type of ' + part);
                    }

                    var template = '<div class="form-group">' +
                        '<label class="col-sm-2 control-label" translate="api.' + $scope.config.apiName + '.' + name + '">' + name + '</label>' +
                        '<div class="col-sm-8">' +
                        '<textarea rows="6" name="' + name + '" placeholder="' + tip + '" class="form-control" ng-model="api.' + part + '.' + name + '" ' + requiredStr + '></textarea>' +
                        helpStr + '</div></div><div class="line line-dashed b-b line-lg pull-in"></div>';
                    return template;
                }

                function renderMultiEnumElement(name, options, required, part, tip, help) {
                    if (!name || name === '') {
                        throw new Error('Name of a property could not be null or empty.');
                    }

                    if (!options || options.length === 0) {
                        throw new Error('Options of an enum property [name=' + name + '] could not be null or empty.');
                    }

                    required = required || true;
                    var requiredStr = required ? 'required' : '';
                    tip = tip ? tip : '';
                    var helpStr = help ? '<span class="help-block m-b-none">' + help + '</span>' : '';

                    if ('uri' === part) {
                        $scope.config.uriProperties.push(name);
                    } else if ('body' === part) {
                        $scope.config.bodyProperties.push(name);
                    } else {
                        throw new Error('Unexpected part type of ' + part);
                    }

                    var template = '<div class="form-group">' +
                        '<label class="col-sm-2 control-label" translate="api.' + $scope.config.apiName + '.' + name + '">' + name + '</label>' +
                        '<div class="col-sm-8">' +
                        '<select multiple name="' + name + '" placeholder="' + tip + '" class="form-control" ng-model="api.' + part + '.' + name + '" ' + requiredStr + '>';

                    for (var i = 0; i < options.length; i++) {
                        template += '<option>' + options[i] + '</option>';
                    }
                    template += '</select>' + helpStr + '</div></div><div class="line line-dashed b-b line-lg pull-in"></div>';

                    return template;
                }

                function success(data, status, headers, config, statusText) {
                    $scope.steps.percent = 100;
                    $scope.response = JSON.stringify(data, undefined, 2);
                    toaster.pop({
                        type: 'success',
                        title: '提示',
                        body: '操作成功!'
                    });
                }

                function error(data, status, headers, config, statusText) {
                    $scope.response = JSON.stringify(data, undefined, 2);
                    toaster.pop({
                        type: 'error',
                        title: '提示',
                        body: '操作失败，错误信息：' + status
                    });
                }

            }
        };
    }
])
// fix the bug: invalid date format of model binding by adding a custome directive, refer to:
// http://stackoverflow.com/questions/24198669/angular-bootsrap-datepicker-date-format-does-not-format-ng-model-value#
.directive('mydate', function(dateFilter, $parse) {
    return {
        restrict: 'EAC',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel, ctrl) {
            ngModel.$parsers.push(function(viewValue) {
                return dateFilter(viewValue, 'yyyy-MM-dd 00:00:00');
            });
        }
    };
})
    .controller('DatepickerSimpleCtrl', ['$scope',
        function($scope) {
            $scope.today = function() {
                $scope.dt = new Date();
            };
            $scope.today();

            $scope.clear = function() {
                $scope.dt = null;
            };

            // Disable weekend selection
            $scope.disabled = function(date, mode) {
                return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
            };

            $scope.toggleMin = function() {
                $scope.minDate = $scope.minDate ? null : new Date();
            };
            $scope.toggleMin();

            $scope.open = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.opened = true;
            };

            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1,
                class: 'datepicker'
            };

            $scope.initDate = new Date();
        }
    ]);