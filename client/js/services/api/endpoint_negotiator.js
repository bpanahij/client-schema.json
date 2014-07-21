/**
 * This is a service that handles traversal of endpoints.
 *
 * It is publishing methods to traverse JSON-Hyper-Schema link objects:
 * Such as:
 {
     "title": "Post a comment",
     "rel": "create",
     "href": "/{id}/comments",
     "method": "POST",
     "schema": {
         "type": "object",
         "properties": {
             "message": {
                 "type": "string"
             }
         },
         "required": ["message"]
     }
 }
 *
 * See: http://json-schema.org/latest/json-schema-hypermedia.html#anchor6
 *
 *
 */
define(['./../module'], function (services) {
  services.factory('EndpointNegotiator', [
    '$rootScope',
    '$resource',
    '$q',
    '$window',
    '$http',
    '$location',
    'base64',
    /**
     * @param $rootScope
     * @param $resource
     * @param $q
     * @param $window
     * @param $http
     * @param $location
     * @param base64
     * @returns {Function}
     */
      function ($rootScope, $resource, $q, $window, $http, $location, base64) {
      /**
       * Get the client object from the service
       */
      return function (acceptsHeader) {
        var privateAPI = {}
          , publicAPI = {};
        /**
         * Saving response headers
         */
        privateAPI.responseHeaders = {};
        /**
         * Static Headers that will be reused on each request
         */
        privateAPI.staticHeaders = {
          "Accepts": acceptsHeader,
          "Content-Type": "application/json"
        };
        /**
         * Using the angular $resource service to perform a link traversal
         *
         * at this point the link has been broken down into the components needed to generate a resource request
         *
         * @param url
         * @param methods
         * @param method
         * @param defaults
         * @param payload
         * @param target
         * @param mime
         * @returns {*}
         */
        privateAPI.resourceURLTraverse = function (url, methods, method, defaults, payload, target, mime) {
          // Create a Deferred Object
          var deferred = $q.defer();
          // Refresh methods add search params to URIs
          if (target === "refresh") {
            if (Object.keys(payload).length > 0) {
              $location.search(payload);
            }
            // Data is handled with a different content-type
          } else if (target === "data") {
            // When the schema specifying data target, then use the http method, and do not try to load a schema
            $http({method: methods[method].method, headers: methods[method].headers, url: url}).success(function (data) {
              var encoded_data = base64.encode(data);
              window.location.href = "data:" + mime + encoded_data;
            });
          }
          // External links should be traversed by replacing the entire url
          else if (target === 'external') {
            $window.location.href = url;
            deferred.reject({});
          }
          // New links should be opened in a new window
          else if (target === 'new') {
            window.open('#' + url);
            deferred.reject({});
          } else {
            // All other links are traversed in this window
            var resource = $resource(url, defaults, methods);
            resource[method](payload, function (response, headersFunc) {
              // Save the headers
              privateAPI.responseHeaders = headersFunc();
              // Don't change the url for refresh and nofollow links
              if (target !== 'nofollow' && target !== 'refresh') {
                $location.url(url);
                privateAPI.url = url;
              }
              // Resolve the promise with the response object, containing data
              deferred.resolve(response);
            }, function (err) {
              // Reject the promise with the err, because the request failed
              deferred.reject(err);
            });
          }
          // return the promise
          return deferred.promise;
        };
        /**
         * Preventing properties not in schema from being POST/PUT
         * - Validate against link schema
         *
         * @param link
         * @param params
         * @returns {{}}
         */
        privateAPI.sanitizeParams = function (link, params) {
          var payload = {}
            , defaults = {};
          angular.forEach(link.properties, function (propertyConfig, propertyName) {
            // Don't query with any empty property
            if (!angular.isObject(params[propertyName])
              && !angular.isString(params[propertyName])
              && !angular.isNumber(params[propertyName])) {
              return;
            }
            payload[propertyName] = params[propertyName];
            defaults[propertyName] = angular.isDefined(propertyConfig.default) ? propertyConfig.default : null;
          });
          return {
            payload: payload,
            defaults: defaults
          };
        };
        /**
         * Performing an HTTP METHOD to a given link using params for interpolation,
         * but not updating the schema (as traverse does)
         *
         * @param link
         * @param params
         * @param addHeaders
         * @returns {*}
         */
        publicAPI.link = function (link, params, addHeaders) {
          // Dereference link
          var eLink = angular.copy(link)
          // determining the method: GET is default
            , method = link.method ? link.method : 'GET'
            , methods = {}
            , headers = {}
            , paramsToUse = privateAPI.sanitizeParams(eLink, params);
          // compiling all headers, overriding with rightmost having precedent
          angular.extend(headers, privateAPI.staticHeaders, addHeaders);
          // defining endpoint with method and headers
          methods[method] = {
            method: method,
            headers: headers
          };
          // Now doing the link traversal, proxy through resourceURLTraverse method, which does the dirty-work
          return privateAPI.resourceURLTraverse(link.href, methods, method, paramsToUse.defaults, paramsToUse.payload, link.target, link.mime);
        };
        /**
         * Only returning the publicly available functions (api for this service)
         */
        return publicAPI;
      };
    }]);
});