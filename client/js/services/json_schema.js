/**
 * The Schema crawler logic, parsing out links, and interpolating data into them
 */
define(['./module'], function (services) {
  services.factory('jsonSchema', [
    '$rootScope',
    '$resource',
    '$interpolate',
    '$q',
    '$window',
    '$http',
    '$location',
    'base64',
    /**
     * @param $rootScope
     * @param $resource
     * @param $interpolate
     * @param $q
     * @param $window
     * @param $http
     * @param $location
     * @param base64
     * @returns {Function}
     */
      function ($rootScope, $resource, $interpolate, $q, $window, $http, $location, base64) {
      /**
       * Return a function that accepts a client stub
       */
      return function (client) {
        /**
         * Get the client object from the service
         */
        var apiClient = client;
        /**
         * Alerts for recording what server responded with
         * @type {Array}
         */
        apiClient.alerts = [];
        /**
         * Username of current client
         * @type {string}
         */
        apiClient.username = 'guest';
        /**
         * Saving response headers
         */
        apiClient.responseHeaders = {};
        /**
         * Static Headers that will be reused on each request
         */
        apiClient.staticHeaders = {};
        /**
         * Setting headers for authentication
         *
         * @param username
         * @param token
         */
        apiClient.setCredentials = function (username, token) {
          apiClient.setHeader('Authorization', null);
          apiClient.setHeader('Token', base64.encode(username + ':' + token));
        };
        /**
         * Setting a static header, which will be reused on all future HTTP requests
         * Good for saving Authentication headers
         *
         * @param headerName
         * @param headerValue
         */
        apiClient.setHeader = function (headerName, headerValue) {
          apiClient.staticHeaders[headerName] = headerValue;
        };
        /**
         * Interpolate data across entire schema: useful for dynamic titles, and non link dynamism
         *
         * @param schema
         * @param data
         */
        apiClient.interpolateWholeSchema = function (schema, data) {
          var flatSchema = JSON.stringify(schema)
            , flatSchemaInterpolator = $interpolate(flatSchema);
          flatSchema = flatSchemaInterpolator(data);
          apiClient.schema = JSON.parse(flatSchema);
        };
        /**
         * Finding the link object identified by the rel from an array of link objects
         *
         * @param rel
         * @param links
         * @returns {*}
         */
        apiClient.findRelLink = function (rel, links) {
          var deferred = $q.defer();
          angular.forEach(links, function (link) {
            if (link._link.rel === rel) {
              deferred.resolve(link);
            }
          });
          return deferred.promise;
        };
        /**
         * Traversing schemas/sub-schemas to find links
         * keeping track of the path, and then compile and interpolate any links found
         *
         * root is a continued reference to the root schema
         * schema is the local schema at each level of recursion
         * pathParts starts empty, and then is recursively appended with the path as this
         * method re-curse through the schema properties
         *
         * @param root
         * @param schema
         * @param pathParts
         */
        apiClient.resolveEmbeddedLinks = function (root, schema, pathParts) {
          if (angular.isUndefined(pathParts)) {
            // Initialize a persistent path reference
            pathParts = [];
          }
          // Looking for "links" property on schema
          if (angular.isDefined(schema.links)) {
            // Go through links
            for (var link in schema.links) {
              if (!schema.links.hasOwnProperty(link)) {
                continue;
              }
              // Copy the path and the data, and create a fresh data
              var pathPartsCopy = angular.copy(pathParts)
                , rootDataCopy = angular.copy(root.data)
                , data = {};
              // Compile the data and link together:
              // this is the final pathway for this method, where the link is generated
              apiClient.compileLink(root, rootDataCopy, data, pathPartsCopy, schema.links[link]);
            }
          }
          // If there are sub-properties of this schema level, then check each property
          if (angular.isDefined(schema.properties)) {
            // Look at each property
            for (var property in schema.properties) {
              if (!schema.properties.hasOwnProperty(property)) {
                continue;
              }
              // generating a fresh de-referenced path
              var propPath = angular.copy(pathParts);
              // compile the path as we go
              propPath.push(property);
              // re-curse again into the method
              apiClient.resolveEmbeddedLinks(root, schema.properties[property], propPath);
            }
          }
          // Array items need to be checked for links as well
          if (angular.isDefined(schema.items)) {
            var arrayPath = angular.copy(pathParts); // add array property name to path
            apiClient.resolveEmbeddedLinks(root, schema.items, arrayPath);
          }
        };
        /**
         * Compiling a link by combining a link object with it's correlated data
         * @param root
         * @param fullPathData
         * @param data
         * @param pathParts
         * @param link
         */
        apiClient.compileLink = function (root, fullPathData, data, pathParts, link) {
          // When all of the path sections have been popped off the array,
          // then interpolate the link
          if (pathParts.length === 0) {
            // Copy the link to dereference it, Dereference the link
            var eLink = angular.copy(link)
            // Flatten the link in prep for interpolation of all of it's properties and values
              , flatLink = JSON.stringify(eLink)
            // create the interpolator instance
              , flatLinkInterpolater = $interpolate(flatLink);
            // interpolate the entirety of found data into the link
            flatLink = flatLinkInterpolater(fullPathData);
            var interpolatedLink = {};
            interpolatedLink._link = JSON.parse(flatLink);
            if (angular.isObject(data)) {
              angular.extend(interpolatedLink, data);
            } else {
              interpolatedLink._self = data;
            }
            if (!angular.isArray(root.links)) {
              // Handle the case where the schema root links array is not present
              root.links = [];
            }
            // Add this interpolated link
            root.links.push(interpolatedLink);
            return;
          }
          // Shift off the beginning of the path
          var seg = pathParts.shift()
            , fullPathDataSeg = fullPathData[seg]
            , d
            , fullPathDataCopy;
          // If path points to an array,
          if (angular.isArray(fullPathDataSeg)) {
            // Loop over all the elements
            for (var dataSeg in fullPathDataSeg) {
              if (!fullPathDataSeg.hasOwnProperty(dataSeg)) {
                continue;
              }
              var aLink = angular.copy(link);
              // Dereference the data and the link
              d = angular.copy(fullPathDataSeg[dataSeg]);
              fullPathDataCopy = angular.copy(fullPathData);
              // Flatten/aggregate all the data at a single level deep literal
              if (angular.isObject(d)) {
                angular.extend(fullPathDataCopy, d);
              } else {
                fullPathDataCopy._self = d;
              }
              // Re-curse into the array item, in case it is an object,
              // it may have properties to re-curse into
              apiClient.compileLink(root, fullPathDataCopy, d, angular.copy(pathParts), aLink);
            }
          }
          // Otherwise if the path points to an object, then
          if (!angular.isArray(fullPathDataSeg) && angular.isObject(fullPathDataSeg)) {
            /// Dereference the data and the link
            var lLink = angular.copy(link);
            d = angular.copy(fullPathDataSeg);
            fullPathDataCopy = angular.copy(fullPathData);
            // Flatten/aggregate all the data at a single level deep literal
            if (angular.isObject(fullPathDataSeg)) {
              angular.extend(fullPathDataCopy, fullPathDataSeg);
            } else {
              fullPathDataCopy._self = fullPathDataSeg;
            }
            // Recurse into object in case it has sub-properties
            apiClient.compileLink(root, fullPathDataCopy, d, angular.copy(pathParts), lLink);
          }
        };
        /**
         * Using the OPTIONS method on a URL to find schema
         *
         * @param url
         * @returns {*}
         */
        apiClient.resolveSchema = function (url) {
          var deferred = $q.defer();
          // Make an OPTIONS request
          $http({method: 'OPTIONS', url: url}).success(function (schema) {
            // resolve the schema: the headers and status are generally irrelevant here
            deferred.resolve(schema);
          }).error(function (data, status, headers) {
            deferred.reject(data);
          });
          return deferred.promise;
        };
        /**
         * Building the client App:
         * Main method of this Service,
         * Crawling schema to build a dynamic client, conforming to schema descriptors
         * NOTE: This method does not need a schema to traverse a link, it uses a url
         *
         * @param url
         * @returns {*}
         */
        apiClient.buildClient = function (url) {
          var deferred = $q.defer();
          // Start with empty data
          apiClient.data = {};
          // Retrieve the authorization token from session storage
          apiClient.setHeader('Token', sessionStorage.token);
          var defaults = {}
            , methods = {'GET': {method: 'GET', headers: apiClient.staticHeaders}}
            , method = 'GET'
            , payload = {}
            , target = 'self';
          apiClient.resourceURLTraverse(url, defaults, methods, method, payload, target)
            .then(function (data) {
              apiClient.data = data;
              // get the schema for this URL
              apiClient.resolveSchema(url).then(function (schema) {
                // Add the schema to the client, and make a copy of it for safe keeping
                apiClient.schema = schema;
                // This copy will be used for refresh
                apiClient.origSchema = angular.copy(schema);
                apiClient.links = [];
                apiClient.url = url;
                apiClient.resolveEmbeddedLinks(apiClient, angular.copy(apiClient.origSchema));
                apiClient.interpolateWholeSchema(angular.copy(apiClient.origSchema), data);
                deferred.resolve(apiClient);
              }, function (err) {
                deferred.reject(err);
              });
            }, function (err) {
              deferred.reject(err);
            });
          return deferred.promise;
        };
        /**
         * Traversing to the Schema of the given rel link
         *
         * @param rel
         * @param params
         * @returns {*}
         */
        apiClient.traverse = function (rel, params) {
          var deferred = $q.defer();
          // Find the link in the interpolated link array
          apiClient.findRelLink(rel, apiClient.links)
            .then(function (link) {
              // follow the link, with the new data
              apiClient.link(link, params).then(function (data) {
                // Replace the client data with the new data
                // Just send the request and then ignore the data and don't get the options
                if (link._link.target === 'nofollow') {
                  deferred.resolve(apiClient);
                  return;
                }
                apiClient.data = data;
                // Just re-interpolate the new data into the original schema
                if (link._link.target === 'refresh') {
                  apiClient.links = [];
                  apiClient.resolveEmbeddedLinks(apiClient, angular.copy(apiClient.origSchema));
                  apiClient.interpolateWholeSchema(angular.copy(apiClient.origSchema), data);
                  deferred.resolve(apiClient);
                  return;
                }
                // Default behavior, get the OPTIONS
                apiClient.resolveSchema(link._link.href).then(function (schema) {
                  apiClient.schema = schema;
                  // This copy will be used for refresh
                  apiClient.origSchema = angular.copy(schema);
                  apiClient.links = [];
                  apiClient.resolveEmbeddedLinks(apiClient, angular.copy(apiClient.origSchema));
                  apiClient.interpolateWholeSchema(angular.copy(apiClient.origSchema), data);
                  deferred.resolve(apiClient);
                }, function (err) {
                  deferred.reject(err);
                });
              }, function (err) {
                deferred.reject(err);
              });
            }, function (err) {
              deferred.reject(err);
            });
          return deferred.promise;
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
        apiClient.link = function (link, params, addHeaders) {
          var deferred = $q.defer();
          // Dereference link
          var eLink = angular.copy(link);
          // determining the method: GET is default
          var method = eLink._link.method ? eLink._link.method : 'GET'
            , methods = {}
            , defaults = {}
          // JSON Hyper schema always defaults toi application/json content type
            , headers = {
              'Content-Type': 'application/json'
            };
          // Validate against link schema
          var payload = {};
          // Preventing properties not in schema from being POST/PUT
          angular.forEach(eLink._link.properties, function (propertyConfig, propertyName) {
            // Don't query with any empty property
            if (!angular.isObject(params[propertyName])
              && !angular.isString(params[propertyName])
              && !angular.isNumber(params[propertyName])) {
              return;
            }
            payload[propertyName] = params[propertyName];
          });
          // compiling all headers
          angular.extend(headers, apiClient.staticHeaders, addHeaders);
          // defining endpoint with method and headers
          methods[method] = {
            method: method,
            headers: headers
          };
          // Using default values when the property is still undefined
          angular.forEach(eLink._link.properties, function (config, prop) {
            defaults[prop] = angular.isDefined(config.default) ? config.default : null;
          });
          // Now doing the link traversal
          apiClient.resourceURLTraverse(eLink._link.href, defaults, methods, method, payload, eLink._link.target, eLink._link.mime)
            .then(function (response) {
              deferred.resolve(response);
            }, function (err) {
              deferred.reject(err);
            });
          return deferred.promise;
        };
        /**
         * Using the angular $resource service to perform a link traversal
         *
         * @param url
         * @param defaults
         * @param methods
         * @param method
         * @param payload
         * @param target
         * @param mime
         * @returns {*}
         */
        apiClient.resourceURLTraverse = function (url, defaults, methods, method, payload, target, mime) {
          var deferred = $q.defer();
          if (target === "refresh") {
            if (Object.keys(payload).length > 0) {
              $location.search(payload);
            }
          } else if (target === "data") {
            // When the schema specifying data target, then use the http method, and do not try to load a schema
            $http({method: methods[method].method, headers: methods[method].headers, url: url})
              .success(function (data) {
                var encoded_data = base64.encode(data);
                window.location.href = "data:" + mime + encoded_data;
              });
          }
          // External links should be traversed by replacing the entire url
          else if (target === 'external') {
            $window.location.href = url;
            deferred.reject({});
          } // New links should be opened in a new window
          else if (target === 'new') {
            window.open('#' + url);
            deferred.reject({});
          } else {
            // All other links are traversed in this window
            var resource = $resource(url, defaults, methods);
            resource[method](payload, function (response, headersFunc) {
              var headers = headersFunc();
              if (angular.isDefined(headers['x-username']) && angular.isDefined(headers['x-token'])) {
                // Clear the Auth header, to prevent sending password anymore
                apiClient.setHeader('Authorization', null);
                var token = base64.encode(headers['x-username'] + ':' + headers['x-token']);
                // Set the Auth Token
                apiClient.setHeader('Token', token);
                // Save the Token
                sessionStorage.token = token;
              }
              // Save the headers
              apiClient.responseHeaders = headers;
              // Don't change the url for refresh and nofollow links
              if (target !== 'nofollow' && target !== 'refresh') {
                $location.url(url);
                apiClient.url = url;
              }
              $rootScope.actualLocation = $location.path();
              deferred.resolve(response);
            }, function (err) {
              deferred.reject(err);
            });
          }
          return deferred.promise;
        };
        return apiClient;
      };
    }])
});
