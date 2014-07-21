/**
 * Filtering links on object values contained in the _link
 */
define(['./module'], function (filters) {
  filters.filter('filterObjectBy', [
    function () {
      return function (items, filter) {
        var filtered = {};
        angular.forEach(items, function (item, key) {
          var pass = true;
          angular.forEach(filter, function (fVal, fKey) {
            if (item[fKey] != fVal) {
              pass = false;
            }
          });
          if (pass) {
            filtered[key] = item;
          }
        });
        return filtered;
      };
    }]);
});
