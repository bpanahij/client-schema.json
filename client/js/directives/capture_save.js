define(['./module'], function (directives) {
  directives.directive('captureSave', [
    function () {
      'use strict';
      /**
       * Capture the Save keyboard shortcut and show a save tooltip
       */
      return {
        restrict: 'A',
        link: function () {
          var listener = new window.keypress.Listener();
          listener.simple_combo("meta s", function (e) {
            $(".navbar").popover('show');
            e.preventDefault();
          });
        }
      };
    }
  ]);
});
