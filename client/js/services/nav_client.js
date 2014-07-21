define(['./module'], function (services) {
  services.factory('navClient', [
    function () {
      var navClient = {};
      return function () {
        return navClient;
      }
    }]);
});
