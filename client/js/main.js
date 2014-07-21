require.config({
  "paths": {
    "require": "../libs/require.min",
    "domReady": "../libs/domReady.min",
    "angular": "../libs/angular.min",
    "angular-resource": "../libs/angular-resource.min"
  },
  "shim": {
    "angular": {
      "exports": "angular"
    },
    "angular-resource": {
      "deps": ["angular"]
    }
  },
  "deps": ["./bootstrap_app"]
});
