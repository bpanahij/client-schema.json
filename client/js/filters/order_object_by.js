/**
 * Ordering links on object values contained in the _link
 */

define(['./module'], function (filters) {
  filters.filter('orderObjectBy', [
    function () {
      return function (items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function (item) {
          filtered.push(item);
        });
        filtered.sort(function (a, b) {
          return (a[field] > b[field]);
        });
        if (reverse) {
          filtered.reverse();
        }
        return filtered;
      };
    }]);
});
