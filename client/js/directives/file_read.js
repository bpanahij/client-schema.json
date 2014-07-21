define(['./module'], function(directives) {
  directives.directive('fileread', [
    'socket',
    function (socket) {
      'use strict';
      /**
       * An http/socket based file upload
       */
      return {
        scope: {
          fileread: '=',
          progress: '='
        },
        link: function (scope, element) {
          socket.on('progress:change', function (data) {
            scope.progress = Math.ceil(100 * data.loaded / data.total);
          });
          element.bind('change', function (changeEvent) {
            var reader = new FileReader();
            reader.onload = function (loadEvent) {
              scope.$apply(function () {
                scope.fileread = {
                  raw: loadEvent.target.result
                };
                element.trigger('keyup');
              });
            };
            reader.readAsDataURL(changeEvent.target.files[0]);
          });
        }
      };
    }
  ]);
});
