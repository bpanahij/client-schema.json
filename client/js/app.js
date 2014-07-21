define([
  'angular',
  'angular-resource',
  './filters/index',
  './services/index'
], function (angular) {
  'use strict';
  return angular.module('client-schema', [
    'ngResource',
    'app.services',
    'app.filters'
  ]).config([
    '$httpProvider',
    function ($httpProvider) {
      // Intercept response and handle success (2XX), redirects (3XX), and error (4XX-5XX) codes
      $httpProvider.interceptors.push('ApiResponseHandler');
    }
  ]).run();
});
