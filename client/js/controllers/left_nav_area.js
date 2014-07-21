define(['./module'], function (controllers) {
  'use strict';
  controllers.controller('LeftNavArea', [
    '$rootScope',
    '$location',
    '$scope',
    'jsonSchema',
    'navClient',
    '$q',
    function ($rootScope, $location, $scope, JsonSchema, navClient, $q) {
      'use strict';
      /**
       * The API Client
       */
      $rootScope.client = navClient();
      $rootScope.client.staticHeaders = {
        accepts: 'application+psprt+leftnav/json'
      };

      /**
       * Grouping left nav links by most common part of href
       */
      $scope.groupLeftNavLinks = function () {
        $scope.leftNavGroups = [];
        angular.forEach($scope.client.links, function (link) {
          if (link._link.importance !== 'leftnav') {
            return;
          }
          if ($scope.leftNavGroups.indexOf(link._link.group) === -1) {
            $scope.leftNavGroups.push(link._link.group);
          }
        });
      };
      /**
       * Watch for changes to the schema, i.e. on api endpoint changes
       */
      $scope.$watch('client.schema', function () {
        $scope.groupLeftNavLinks();
      });
      /**
       * Traverse a link to a new URL, given the rel and the link params/data
       */
      $scope.traverse = function () {
        clearTimeout($rootScope.alertTimeout);
        var deferred = $q.defer();
        $rootScope.client.traverse(this.link._link.rel, this.link).then(function (err, resp) {
          deferred.resolve(resp);
        }, function (err) {

        });
        return deferred.promise;
      };
      /**
       * Get the Schema Client
       */
      var startURL = $location.url() ? $location.url() : '/api/v1';
      JsonSchema($rootScope.client).buildClient(startURL).then(function (client) {
        $rootScope.client = client;
      });
    }
  ]);
});