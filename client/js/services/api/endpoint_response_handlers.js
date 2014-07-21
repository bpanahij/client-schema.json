define(['./../module'], function (services) {
  services.factory('EndpointResponseHandler', [
    '$rootScope',
    '$window',
    '$location',
    '$q',
    'jsonClient',
    'base64',
    function ($rootScope, $window, $location, $q, jsonClient, base64) {
      const REDIRECT_CODE = 300;
      const ERROR_CODE = 400;
      var httpHandlers = {};
      /**
       *
       * @param response
       */
      httpHandlers.setHeaders = function (response) {
        var client = jsonClient()
          , headers = response.headers();
        // Check for headers that tell the client how to authenticate
        if (angular.isDefined(headers['username']) && angular.isDefined(headers['token'])) {
          var token = base64.encode(headers['username'] + ':' + headers['token']);
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
         * Handling Successful Responses
         *
         * @param response
         * @returns {*}
         */
        response: function (response) {
          var headers = response.headers();
          // Always return Schema docs
          if (headers['content-type'] !== 'application/json+psprt') {
            return response;
          }
          // Save the Headers
          httpHandlers.setHeaders(response);
          return response;
        },
        /**
         * Handling Redirect and Failure Responses
         * @param response
         * @returns {*}
         */
        responseError: function (response) {
          var headers = response.headers();
          // Always return Schema docs
          if (headers['content-type'] !== 'application/json+psprt') {
            return response;
          }
          var redirectURL = headers.location;
          if (response.status >= REDIRECT_CODE && response.status < ERROR_CODE) {
            // Save the Headers
            httpHandlers.setHeaders(response);
            // Rebuild the client links and data / re-interpolate it
            $location.path(redirectURL);
            return response;
          }
          if (response.status >= ERROR_CODE) {
            return $q.reject(response);
          }
          return response;
        }
      };
    }]);
});
