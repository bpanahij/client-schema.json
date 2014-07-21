define(['./module'], function (services) {
  services.factory('socket', [
    '$rootScope',
    function ($rootScope) {
      'use strict';
      /**
       * Socket.io client side service
       */
      var socket = window.io.connect('/', {
        secure: false
      });
      return {
        on: function (eventName, callback) {
          socket.on(eventName, function () {
            var args = arguments;
            $rootScope.$apply(function () {
              callback.apply(socket, args);
            });
          });
        },
        emit: function (eventName, data, callback) {
          socket.emit(eventName, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
              if (callback) {
                callback.apply(socket, args);
              }
            });
          });
        }
      };
    }
  ]);
});
