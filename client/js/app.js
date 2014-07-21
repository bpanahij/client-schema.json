define([
  'angular',
  './controllers/index',
  './directives/index',
  './filters/index',
  './services/index',
  './schema_app'
], function (ng) {
  'use strict';
  return ng.module('app', [
    'schemaApp',
    'app.services',
    'app.controllers',
    'app.filters',
    'app.directives',
    'dragAndDrop'
  ]).run(function() {});
});
