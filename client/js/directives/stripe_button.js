define(['./module'], function (directives) {
  'use strict';
  directives.directive('stripeButton', [
    function () {
      var linkFunc = function (scope, element, attrs) {
        scope.token = false;
        scope.paid = false;
        if (scope.link._link.paid > 0) {
          scope.token = true;
          scope.buttonAction = 'PAID';
          return;
        } else {
          scope.buttonAction = 'Pay Application Fee ($' + scope.link._link.price + ')';
        }
        var handler = StripeCheckout.configure({
          key: scope.link.stripe_publishable_key,
          image: '/assets/images/passportEDU_nb.png',
          token: function (token, args) {
            scope.buttonAction = 'Processing...';
            scope.token = true;
            scope.link.token = token;
            scope.$apply();
            scope.action(scope.link);
          }
        });
        element.on('click', function (e) {
          handler.open({
            name: scope.link._link.name,
            description: scope.link._link.description,
            amount: (scope.link._link.price * 100)
          });
          e.preventDefault();
        });
      };
      return {
        restrict: 'AE',
        replace: true,
        transclude: true,
        scope: {
          link: '=',
          image: '=',
          amount: '=',
          action: '=',
          key: '='
        },
        link: linkFunc,
        template: '<button class="btn btn-block" ng-class="{\'btn-primary\': !token, \'btn-success\': token || paid}">' +
          '<span ng-bind="buttonAction"></span> <span ng-show="token" ng-bind="amount | currency"</button>'
      }
    }]);
});
