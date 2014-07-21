define(['./module'], function (services) {
  services.factory('ApiResponseHandler', [
    '$rootScope',
    '$window',
    '$location',
    '$q',
    'jsonClient',
    'base64',
    function ($rootScope, $window, $location, $q, jsonClient, base64) {
      var failureMessage = {
          message: 'Failure'
        }
        , httpHandlers = {};
      httpHandlers.setHeaders = function (response) {
        var client = jsonClient()
          , headers = response.headers();
        client.username = headers['x-intercom-username'];
        if (angular.isDefined(headers['x-username']) && angular.isDefined(headers['x-token'])) {
          var token = base64.encode(headers['x-username'] + ':' + headers['x-token']);
          client.setHeader('Authorization', null);
          client.setHeader('Token', token);
          sessionStorage.token = token;
        }
      };
      /**
       * Intercepting responses
       *
       * Interceptor returning a function that accepts a promise,
       * and returns a callback to the success and other methods
       */
      return {
        /**
         *
         * @param response
         * @returns {*}
         */
        response: function (response) {
          var client = jsonClient(),
            headers = response.headers();
          // Always return Schema docs
          if (headers['content-type'] !== 'application/json+psprt') {
            return response;
          }
          if (response.status >= 200 && response.status < 300) {
            if (angular.isDefined(response.data.message)) {
              client.alerts.push({
                message: response.data.message,
                error: false
              });
            }
          }
          // Save the Headers
          httpHandlers.setHeaders(response);
          return response;
        },
        /**
         *
         * @param response
         * @returns {*}
         */
        responseError: function (response) {
          var client = jsonClient()
            , headers = response.headers();
          // Always return Schema docs
          if (headers['content-type'] !== 'application/json+psprt') {
            return response;
          }
          var redirectURL = headers.location;
          if (response.status >= 300 && response.status < 400) {
            if (angular.isDefined(response.data.message)) {
              client.alerts.push({
                message: response.data.message,
                error: false
              });
            }
            // Save the Headers
            httpHandlers.setHeaders(response);
            // Rebuild the client links and data / re-interpolate it
            $location.path(redirectURL);
            client.url = redirectURL;
            client.buildClient(redirectURL).then(function (client) {
              $location.path(redirectURL);
            });
            return response;
          }
          if (response.status >= 400) {
            if (angular.isDefined(response.data.message)) {
              client.alerts.push({
                message: response.data.message,
                error: true
              });
            } else {
              client.alerts.push(failureMessage);
            }
            return $q.reject(response);
          }
          return response;
        }
      };
    }]);
});
