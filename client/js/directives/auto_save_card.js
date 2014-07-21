define(['./module'], function (directives) {
  directives.directive('autoSaveCard', [
    'debounce',
    function (debounce) {
      'use strict';
      /**
       * An directive that will traverse a link when and ng-models within it change
       */
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
          var saveIt = debounce(function () {
            var link = ngModel.$viewValue;
            scope.client.traverse(link._link.rel, link).then(function (resp) {
            });
          }, 1000);
          element.bind('keyup change image', function () {
            saveIt();
          });
        }
      };
    }
  ]);
});
