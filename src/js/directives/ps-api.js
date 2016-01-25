angular.module('app').directive('api', ['$compile',
    function($compile) {
        return {
            replace: true,
            restrict: 'E',
            scope: true,
            controller: ['$scope', '$element', '$attrs', '$http', '$state', 'toaster', 'apiService',
                function($scope, $element, $attrs, $http, $state, toaster, apiService) {
                    var mergedConfig = angular.extend({}, $scope.$eval($attrs.apiOptions)); // attr of attrs will be formatted like api-options -> apiOptions

                    $scope.config = {
                        token: '',
                        apiGroup: mergedConfig['group'],
                        apiName: mergedConfig['name'],
                        server: '',
                        api: {
                            uri: {},
                            body: {}
                        },
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
                        renderPageViaApiDef($scope.config.apiGroup, $scope.config.apiName);
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
                        invokeApi($scope.config, $scope.api);
                    };

                    function renderPageViaApiDef(group, name) {
                        $scope.config.servers = apiService.getServerNames();
                        $scope.config.token = apiService.getToken();
                        $scope.config.api = apiService.getApi(group, name);


                        if ($scope.config.api) {
                            var t1 = renderUIElements($scope.config.api);
                            var template1 = $compile(t1)($scope);
                            $element.find('#api_properties').append(template1);

                            var t2 = renderUIOutput($scope.config.uriProperties, $scope.config.bodyProperties);
                            var template2 = $compile(t2)($scope);
                            $element.find('#api_properties_output').append(template2);
                        } else {
                            throw new Error('API [' + name + '] of [' + group + '] could not be found.');
                        }
                    }

                    function initParameters() {
                        var initParameters = $scope.$eval($attrs.initParams);

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

                    function renderUIElements(api) {
                        // render uri path
                        var uri = renderUri(api.uri);

                        // render body
                        var body = renderBody(api.body);

                        // render query
                        var query = renderQuery(api.query);

                        return uri + body + query;
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
                                    default:
                                        throw new Error('Unexpected data type of ' + element.dtype);
                                }
                            }
                        }

                        return html;
                    }

                    function renderQuery(query) {
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

                    function invokeApi(config, api) {
                        var server = config.server;

                        // prepare uri
                        var uri = prepareUri(config.api.uri, api.uri);

                        // prepare body
                        var body = prepareBody(config.api.body, api.body);
                        console.log(body);

                        // prepare header
                        var header = prepareHeader(config.api.auth);

                        // prepare query

                        // send request
                        $http({
                            method: config.api.method,
                            url: server + uri,
                            body: body,
                            headers: header
                        })
                            .success(function(data, status) {
                                console.log(data);
                                success();
                            })
                            .error(function(data, status) {
                                console.log(data);
                                error(status);
                            });
                    }

                    function prepareUri(uri, properties) {
                        var paths = uri.split('/');

                        for (var i = 0; i < paths.length; i++) {
                            if (paths[i] === '') {
                                continue;
                            }
                            if (paths[i].indexOf(':') === 0) {
                                var path = paths[i].substring(1, paths[i].length);
                                uri = uri.replace(':' + path, properties[path]);
                            }
                        }

                        return uri;
                    }

                    function prepareBody(body, properties) {
                        if (!body || body.length === 0) {
                            return '';
                        }

                        return JSON.stringify(properties);
                    }

                    function prepareHeader(needAuth) {
                        needAuth = needAuth || false;

                        if (needAuth) {
                            return {
                                Authorization: 'Bearer ' + $scope.config.token
                            };
                        } else {
                            return {};
                        }

                    }

                    function success() {
                        $scope.steps.percent = 100;
                        toaster.pop({
                            type: 'success',
                            title: '提示',
                            body: '操作成功!',
                            onHideCallback: function() {
                                $state.reload();
                            }
                        });
                    }

                    function error(e) {
                        toaster.pop({
                            type: 'error',
                            title: '提示',
                            body: '操作失败，错误信息：' + e
                        });
                    }
                }
            ],
            link: function(scope, elm, attrs, ctrl) {},
            templateUrl: 'tpl/ps/api_template.html'
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