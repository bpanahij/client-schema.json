require.config({
  "paths": {
    "require": "../libs/require.min",
    "jquery": "../libs/jquery.min",
    "domReady": "../libs/domReady.min",
    "angular": "../libs/angular.min",
    "angular-resource": "../libs/angular-resource.min",
    "angular-touch": "../libs/angular-touch.min",
    "angular-dnd": "../libs/angular-dnd.min",
    "keypress": "../libs/keypress.min",
    "bootstrap": "../libs/bootstrap.min",
    "socketio": "../libs/socket.io.min",
    "intercom": "../libs/intercom.v1",
    "stripe": "../libs/checkout"
  },
  "shim": {
    "angular": {
      "exports": "angular"
    },
    "jquery": {
      "exports": "$"
    },
    "angular-resource": {
      "deps": ["angular"]
    },
    "angular-touch": {
      "deps": ["angular"]
    },
    "angular-dnd": {
      "deps": ["angular"]
    },
    "bootstrap": {
      "deps": ["jquery"]
    }
  },
  "deps": ["./bootstrap_app"]
});
