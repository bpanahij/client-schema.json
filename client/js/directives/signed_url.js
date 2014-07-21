define(['./module'], function (directives) {
  directives.directive('signedUrl', [
    '$rootScope',
    '$http',
    function ($rootScope, $http) {
      'use strict';
      return {
        scope: {
          signedUrl: '@'
        },
        restrict: 'A',
        link: function (scope, element, attrs) {
          if (angular.isUndefined(attrs.signedUrl) || !attrs.signedUrl) {
            return;
          }
          var userId = $rootScope.client.data.studentId || $rootScope.client.data.admissionsId
            , userType = $rootScope.client.data.admissionsId ? 'admissions' : 'students';
          if (angular.isUndefined(userId)) {
            return;
          }
          $http.get('/api/v1/' + userType + '/' + userId + '/signedurl', {
            headers: {
              Token: $rootScope.client.staticHeaders.Token
            },
            params: {
              s3Path: attrs.signedUrl
            },
            method: 'GET'
          }).then(function (response) {
            scope.signedURL = response.data.signedURL;
          });
        },
        template: '<img width="100%" ng-src="{{signedURL}}">'
      }
    }
  ])
});
