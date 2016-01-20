angular.module('app')
	.directive(
		'api', ['$compile', function($compile){
			return{
				replace: true,
				restrict: 'E',
				scope: true,
				controller: ['$scope', '$element', '$attrs', '$http', '$state', 'toaster', function ($scope, $element, $attrs, $http, $state, toaster) {
					var mergedConfig = angular.extend({}, $scope.$eval($attrs.apiOptions)); // attr of attrs will be formatted like api-options -> apiOptions
					$scope.config = {
						token: 'YWMtQhKNgL9MEeW7B61GSMfXbQAAAVOTDK5Y_6gFvUyg70E8FCEDvVRqsML-M6c',
	                    apiGroup: mergedConfig['group'],
	                    apiName: mergedConfig['name'],
	                    server: '',
	                    api: {
	                    	uri: {},
	                    	body: {}
	                    },
	                    uriProperties: [],
	                    bodyProperties: []
	                };

	                function renderPageViaApiDef(group, name) {
	                	$http.get('js/api.json').success(function (data) {
                    		$scope.config.servers = data.servers;

                    		for( var i=0; i<data.services.length; i++ ) {
                    			if(data.services[i].group === group) {
                    				for( var j=0; j<data.services[i].apis.length; j++ ) {
                    					if(data.services[i].apis[j].name === name) {
                    						$scope.config.api = data.services[i].apis[j];
                    						break;
                    					}
                    				}
                    				break;
                    			}
                    		}

                    		if( $scope.config.api ) {
                    			console.log($scope.config.api);

                    			var t1 = renderUIElements($scope.config.api);
                    			var template1 = $compile(t1)($scope);
                        		$element.find('#api_properties').append(template1);

                        		var t2 = renderUIOutput($scope.config.uriProperties, $scope.config.bodyProperties);
                        		var template2 = $compile(t2)($scope);
                        		$element.find('#api_properties_output').append(template2);
                    		}
                    		else {
                    			throw new Error(name + ' of ' + group + ' could not be found.');
                    		}
                		});
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
	                	if(!uri) {
	                		throw new Error('URI is required of a API schema.');
	                	}

	                	var html = '';
	                	var paths = uri.split('/');
	                	for(var i=0; i<paths.length; i++) {
	                		if(paths[i] === '') {
	                			continue;
	                		}
	                		if(paths[i].indexOf(':') === 0) {
	                			html += renderStrElement(paths[i].substring(1, paths[i].length), true, 'uri');
	                		}
	                	}

	                	return html;
	                }

	                function renderBody(body) {
	                	var html = '';

	                	if(body) {
	                		for(var i=0; i<body.length; i++) {
		                		var element = body[i];

		                		switch (element.dtype) {
		                			case 'str':
		                				html += renderStrElement(element.property, element.required, 'body');
		                				break;
		                			case 'enum':
		                				html += renderEnumElement(element.property, element.options, element.required, 'body');
		                				break;
		                			default:
		                				throw new Error('Unexpected data type of ' + dtype);
		                		}
		                	}
	                	}

	                	return html;
	                }

	                function renderQuery(query) {
	                	return '';
	                }

	                function renderStrElement(name, required, part) {
	                	if(!name || name === '') {
	                		throw new Error('Name of a property could not be null or empty.');
	                	}

	                	required = required || true;
	                	var requiredStr = required ? 'required' : '';

	                	if( 'uri' === part ) {
	                		$scope.config.uriProperties.push(name);
	                	} else if( 'body' === part ) {
	                		$scope.config.bodyProperties.push(name);
	                	} else {
	                		throw new Error('Unexpected part type of ' + part);
	                	}
	                	
	                	// TODO - binding invalid
	                	var template = '<p>' + name + ':</p><input name="' + name + '" class="form-control" ng-model="api.' + part + '.' + name + '" ' + requiredStr + '>';
	                	return template;
	                }

	                function renderEnumElement(name, options, required, part) {
	                	if(!name || name === '') {
	                		throw new Error('Name of a property could not be null or empty.');
	                	}

	                	if(!options || options.length === 0) {
	                		throw new Error('Options of an enum property [name=' + name + '] could not be null or empty.');
	                	}

	                	required = required || true;
	                	var requiredStr = required ? 'required' : '';

	                	if( 'uri' === part ) {
	                		$scope.config.uriProperties.push(name);
	                	} else if( 'body' === part ) {
	                		$scope.config.bodyProperties.push(name);
	                	} else {
	                		throw new Error('Unexpected part type of ' + part);
	                	}

	                	var template = '<p>' + name + ':</p><select name="' + name + '" class="form-control m-b" ng-model="api.' + part + '.' + name + '" ' + requiredStr + '>';
	                	for(var i=0; i<options.length; i++) {
	                		template += '<option>' + options[i] + '</option>';
	                	}
	                	template += '</select>';

	                	return template;
	                }

	                function renderUIOutput(p1, p2) {
	                	p1 = p1 || [];
	                	p2 = p2 || [];

	                	var html = '';
	                	for(var i=0; i<p1.length; i++) {
	                		html += '<p>' + p1[i] + ': {{api.uri' + p1[i] + '}}</p>';
	                	}
	                	for(var i=0; i<p2.length; i++) {
	                		html += '<p>' + p2[i] + ': {{api.body' + p2[i] + '}}</p>';
	                	}

	                	return html;
	                }

	                $scope.render = function(){
	                	renderPageViaApiDef($scope.config.apiGroup, $scope.config.apiName);
	                }();

	                $scope.done = function() {
	                	invokeApi($scope.config, $scope.api);
	                };

	                function invokeApi(config, api) {
	                	var server = config.server;

	                	// prepare uri
	                	var uri = prepareUri(config.api.uri, api.uri);

	                	// prepare body
	                	var body = prepareBody(config.api.body, api.body);

	                	// prepare header
	                	var header = prepareHeader(config.api.auth);

	                	// prepare query

	                	// send request
	                }

	                function prepareUri(uri, properties) {
	                	var paths = uri.split('/');

	                	for(var i=0; i<paths.length; i++) {
	                		if(paths[i] === '') {
	                			continue;
	                		}
	                		if(paths[i].indexOf(':') === 0) {
	                			var path = paths[i].substring(1, paths[i].length);
								uri = uri.replace(':'+path,  properties[path]);
	                		}
	                	}

	                	return uri;
	                }

	                function prepareBody(body, properties) {
	                	if(!body || body.length === 0) {
	                		return '';
	                	}

	                	return JSON.stringify(properties);
	                }

	                function prepareHeader(needAuth) {
	                	needAuth = needAuth || false;

	                	if(needAuth) {
	                		return {Authorization: 'Bearer ' + $scope.config.token};
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
							onHideCallback: function(){
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
				}],
				link: function(scope, elm, attrs, ctrl){
					
				},
				templateUrl: 'tpl/ps/api_template.html'
			};
		}]
	);