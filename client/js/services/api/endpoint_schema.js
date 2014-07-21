/**
 * The Schema crawler logic, parsing out links, and interpolating data into them
 */
define(['./../module'], function (services) {
  services.factory('EndpointSchema', [
    '$rootScope',
    '$resource',
    '$interpolate',
    '$q',
    '$window',
    '$http',
    /**
     * @param $rootScope
     * @param $resource
     * @param $interpolate
     * @param $q
     * @param $window
     * @param $http
     * @returns {Function}
     */
      function ($rootScope, $resource, $interpolate, $q, $window, $http) {
      /**
       * Return a function that accepts a client stub
       */
      return function (accepts) {
        /**
         * Get the client object from the service
         */
        var privateAPI = {}
          , publicAPI = {};
        /**
         * Static Headers that will be reused on each request
         */
        privateAPI.staticHeaders = {
          accepts: accepts
        };
        /**
         * Interpolate data across entire schema: useful for dynamic titles, and non link dynamism
         *
         * @param schema
         * @param data
         */
        privateAPI.interpolateWholeSchema = function (schema, data) {
          var flatSchema = JSON.stringify(schema)
            , flatSchemaInterpolator = $interpolate(flatSchema);
          flatSchema = flatSchemaInterpolator(data);
          privateAPI.schema = JSON.parse(flatSchema);
        };
        /**
         * Finding the link object identified by the rel from an array of link objects
         *
         * @param rel
         * @param links
         * @returns {*}
         */
        privateAPI.findRelLink = function (rel, links) {
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
        privateAPI.resolveEmbeddedLinks = function (root, schema, pathParts) {
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
              privateAPI.compileLink(root, rootDataCopy, data, pathPartsCopy, schema.links[link]);
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
              privateAPI.resolveEmbeddedLinks(root, schema.properties[property], propPath);
            }
          }
          // Array items need to be checked for links as well
          if (angular.isDefined(schema.items)) {
            var arrayPath = angular.copy(pathParts); // add array property name to path
            privateAPI.resolveEmbeddedLinks(root, schema.items, arrayPath);
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
        privateAPI.compileLink = function (root, fullPathData, data, pathParts, link) {
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
              privateAPI.compileLink(root, fullPathDataCopy, d, angular.copy(pathParts), aLink);
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
            // Re-curse into object in case it has sub-properties
            privateAPI.compileLink(root, fullPathDataCopy, d, angular.copy(pathParts), lLink);
          }
        };
        /**
         * Using the OPTIONS & accepts method on a URL to find schema
         *
         * @param url
         * @param endpointResponseData
         * @returns {*}
         */
        publicAPI.interpolate = function (url, endpointResponseData) {
          var deferred = $q.defer();
          // Make an OPTIONS request
          $http({
            method: 'OPTIONS',
            url: url,
            headers: privateAPI.staticHeaders
          }).success(function (schema) {
            // interpolate the endpointResponseData against schema: the headers and status are generally irrelevant here
            privateAPI.schema = schema;
            privateAPI.origSchema = angular.copy(schema);
            privateAPI.links = [];
            privateAPI.url = url;
            privateAPI.resolveEmbeddedLinks(privateAPI, angular.copy(privateAPI.origSchema), undefined);
            privateAPI.interpolateWholeSchema(angular.copy(privateAPI.origSchema), endpointResponseData);
            // Resolve the links (which are the ultimate result of the schema interpolation)
            deferred.resolve(angular.copy(privateAPI.links));
          }).error(function (data) {
            // Something went wrong)
            deferred.reject(data);
          });
          return deferred.promise;
        };
        return privateAPI;
      };
    }]);
});
