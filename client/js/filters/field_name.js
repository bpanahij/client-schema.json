define(['./module'], function (filters) {
  filters.filter('fieldName', [
    function () {
      /**
       * Change the field to a string without spaces
       */
      return function (input) {
        return input.replace(/[^a-zA-Z0-9]/g, '_');
      };
    }
  ])
});
