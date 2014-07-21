define([
  'angular',
  'angular-resource',
  './controllers/index',
  './directives/index',
  './filters/index',
  './services/index'
], function (ng) {
  'use strict';
  return ng.module('schemaApp', [
    'ngResource',
    'dragAndDrop',
    'app.services',
    'app.controllers',
    'app.filters',
    'app.directives'
  ]).config([
    '$httpProvider',
    function ($httpProvider) {
      $httpProvider.interceptors.push('ApiResponseHandler');
    }
  ]).run([
    '$rootScope',
    '$location',
    'jsonClient',
    'jsonSchema',
    function ($rootScope, $location, jsonClient, jsonSchema) {
      /**
       * Watching for path changes
       */
      $rootScope.$watch(function () {
        return $location.path();
      }, function (newLocation) {
        var client = jsonClient();
        // This means the back button was used
        if (angular.isDefined(client.url) && client.url !== newLocation) {
          //  when the back button is used, then rebuild jsonClient
          client.buildClient($location.url()).then(function(newClient) {
            $rootScope.$evalAsync(function() {
              $rootScope.client = newClient;
            })
          });
        }
      });
    }]);
});


