define([
  'require',
  'jquery',
  'angular',
  'angular-resource',
  'angular-touch',
  'angular-dnd',
  'keypress',
  'bootstrap',
  'socketio',
  'intercom',
  'stripe',
  'app'
], function (require, $, ng) {
  'use strict';
  require(['domReady!'], function (document) {
    ng.bootstrap(document, ['app']);
  });
});
