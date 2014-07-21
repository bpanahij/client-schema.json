define(['./module'], function (services) {
  services.factory('jsonClient', [
    function () {
      var apiClient = {};
      return function () {
        return apiClient;
      }
    }]);
});
