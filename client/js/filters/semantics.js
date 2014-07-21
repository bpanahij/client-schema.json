/**
 * Filtering links on semantic values contained in the _link
 */
define(['./module'], function (filters) {
  filters.filter('semantics', [
    function () {
      return function (links, semantics) {
        var filtered = [];
        angular.forEach(links, function (link) {
          angular.forEach(semantics, function (value, key) {
            if (angular.isDefined(link._link) && link._link[key] == value) {
              filtered.push(link);
            }
          });
        });
        return filtered;
      };
    }]);
});
