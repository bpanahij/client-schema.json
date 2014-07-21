define(['./module'], function (controllers) {
  'use strict';
  controllers.controller('AnonApplication', [
    '$rootScope',
    '$scope',
    '$filter',
    'base64',
    function ($rootScope, $scope, $filter, base64) {
      'use strict';
      /**
       * The Anonymous Application Controller
       */
      $scope.cards = [];
      $scope.student = {
        password: 'passportEDU'
      };
      $scope.submitRegisterApp = function () {
        if ($scope.form.$invalid) {
          return;
        }
        $('#register').modal('hide');
        $('body').removeClass('modal-open');
        var cards = $filter('semantics')($rootScope.client.links, {
          importance: 'cards'
        });
        var authHeader = base64.encode($scope.student.username + ':' + $scope.student.password);
        $scope.client.setHeader('Authorization', authHeader);
        $scope.client.setHeader('Token', null);
        $scope.client.traverse('register', {
          student: $scope.student,
          cards: cards
        });
      };
      $scope.showRegister = function () {
        if ($scope.form.$valid) {
          $scope.student.password = '';
          $('#register').modal('show');
        }
      };
    }
  ]);
});