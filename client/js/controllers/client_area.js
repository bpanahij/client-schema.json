/**
 *
 */
define(['./module'], function (controllers) {
  'use strict';
  /**
   *
   */
  controllers.controller('ClientArea', [
    '$rootScope',
    '$window',
    '$resource',
    '$location',
    '$filter',
    '$scope',
    'jsonSchema',
    'jsonClient',
    '$q',
    function ($rootScope, $window, $resource, $location, $filter, $scope, JsonSchema, jsonClient, $q) {
      'use strict';
      /**
       * The API Client
       */
      $rootScope.client = jsonClient();
      /**
       * Alerts to show the user
       * @type {Array}
       */
      $rootScope.alerts = [];
      /**
       * Remove an alert from the client alerts array
       */
      $rootScope.removeAlert = function () {
        var index = $rootScope.alerts.indexOf(this.alert);
        $rootScope.alerts.splice(index, 1);
      };
      /**
       * Watch the schemaClient for alerts, and transfer them to our own alerts
       */
      var watchAlerts = function () {
        $rootScope.$watch(function () {
          return ($rootScope.client.alerts.length + $rootScope.alerts.length);
        }, function () {
          if ($rootScope.client.alerts.length) {
            var alert = $rootScope.client.alerts.pop();
            if ($rootScope.alerts.indexOf(alert) < 0) {
              $rootScope.alerts.push(alert);
              // Hide success messages after a short time,
              // leave error messages until dismissed
              if (!alert.error) {
                (function () {
                  var alert = alert;
                  $rootScope.alertTimeout = setTimeout(function () {
                    var index = $scope.alerts.indexOf(alert);
                    $rootScope.$apply(function () {
                      $scope.alerts.splice(index, 1);
                    });
                  }, 3000);
                })();
              }
            }
          }
        });
      };
      /**
       * Watch the search portion of the URL
       */
      $scope.$watch(function () {
        return $location.search();
      }, function () {
        $scope.query = $location.search();
      });
      /**
       * Watch for page re-sizes and save page size
       */
      $scope.pagesToShow = Math.floor($window.innerWidth / 90);
      /**
       * When the page re-sizes adjust the paging
       */
      $window.onresize = function () {
        $scope.$evalAsync(function () {
          $scope.pagesToShow = Math.floor($window.innerWidth / 90);
        });
      };
      /**
       * Generate Breadcrumbs
       */
      $scope.generateBreadcrumbs = function () {
        if (angular.isUndefined($scope.client.schema)) {
          return;
        }
        var pathParts = $scope.client.schema.id.replace(/\//, '').split('/');
        while (pathParts.length > 0) {
          var crumb = pathParts.join('/')
            , rel = pathParts.pop()
            , title = rel;
          if (rel === 'api' || rel === 'v1') {
            return;
          }
          var foundLink = $scope.client.links.filter(function (link) {
            return link._link.href === '/' + crumb && (link._link.method === 'GET' ||
              angular.isUndefined(link._link.method));
          });
          // Looking for another link with this href/method and using that title if it's set
          if (foundLink.length) {
            title = foundLink[0]._link.title;
          }
          else {
            if (rel.length === 24) {
              title = pathParts[pathParts.length - 1];
              title = title.substr(0, title.length - 1);
            }
          }
          $scope.client.links.unshift({
            _link: {
              title: title,
              href: crumb,
              importance: 'crumb',
              rel: 'crumb_' + rel
            }
          });
        }
      };
      /**
       * Watch for changes to the schema, i.e. on api endpoint changes
       */
      $scope.$watch('client.schema.links', function () {
        $scope.generateBreadcrumbs();
      });
      /**
       * Traverse a link to a new URL, given the rel and the link params/data
       */
      $scope.traverse = function () {
        clearTimeout($rootScope.alertTimeout);
        var deferred = $q.defer()
          , that = this;
        $rootScope.client.traverse(that.link._link.rel, that.link).then(function (err, resp) {
          deferred.resolve(resp);
        }, function (err) {
          console.log(arguments, $scope.client);
          deferred.reject(err);
        });
        return deferred.promise;
      };
      /**
       * Perform a link traversal directly on a link object, with embedded _link property
       */
      $scope.performLink = function (link) {
        clearTimeout($rootScope.alertTimeout);
        $rootScope.client.link(link, link).then(function () {
        }, function (err) {
          console.log(arguments, $scope.client);
        });
      };
      /**
       * Perform the link action on the Draggable
       * @param drag
       */
      $scope.performDragLinkAction = function (drag) {
        clearTimeout($rootScope.alertTimeout);
        $scope.client.traverse(drag._link.rel, drag);
      };
      /**
       * Perform the link action on the Drop Area
       * @param drag
       * @param drop
       */
      $scope.performDropLinkAction = function (drag, drop) {
        clearTimeout($rootScope.alertTimeout);
        $rootScope.client.traverse(drag._link.rel, {
          drag: drag,
          drop: drop
        });
      };
      /**
       * When hovering over drop with draggable
       * @param drag
       * @param drop
       */
      $scope.enterDrop = function (drag, drop) {
        drop._dropOver = true;
      };
      /**
       * When leaving hover over drop with draggable
       * @param drag
       * @param drop
       */
      $scope.leaveDrop = function (drag, drop) {
        drop._dropOver = false;
      };
      /**
       * Get the Schema Client
       */
      var startURL = $location.url() ? $location.url() : '/api/v1';
      JsonSchema($rootScope.client).buildClient(startURL).then(function () {
        watchAlerts();
      });
    }
  ]);
});