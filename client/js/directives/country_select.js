define(['./module'], function (directives) {
  'use strict';
  directives.directive('countrySelect', [
    '$resource',
    'Countries',
    function ($resource, Countries) {
      var link = function (scope) {
        Countries.query(function (results) {
          scope.countries = results;
        });
      };
      return {
        restrict: 'AE',
        replace: true,
        transclude: true,
        require: 'ngModel',
        scope: {
          country: '='
        },
        link: link,
        template: '<select ng-model="country" ng-options="country.code as country.name for country in countries">'
      }
    }]);
});
