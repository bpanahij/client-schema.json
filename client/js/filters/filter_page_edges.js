define(['./module'], function (filters) {
  filters.filter('filterPageEdges', [
    function () {
      /**
       * Special filter for pages
       */
      return function (items, options) {
        var filtered = []
          , middle = Math.floor(items.length / 2) - 1
          , halfPages = (options.pagesToShow / 2);
        angular.forEach(items, function (item, index) {
          if (index < 2 || index > (items.length - 3) ||
            (index > (middle - halfPages) && index < (middle + halfPages))) {
            filtered.push(item);
          }
        });
        return filtered;
      };
    }
  ]);
});
