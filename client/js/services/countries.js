define(['./module'], function (services) {
  services.factory('Countries', [
    '$resource',
    function ($resource) {
      return $resource('/flatFiles/countries.json', {}, {
        query: {
          cache: true,
          method: 'GET',
          isArray: true
        }});
    }]);
});
