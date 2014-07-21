define(['./module'], function (services) {
  services.factory('intercom', [function () {
    /**
     * Run Intercom Analytics in an interval
     */
    setInterval(function () {
      var client = $rootScope.client;
      if (ng.isDefined(window.Intercom)
        && ng.isDefined(client)
        && ng.isDefined(client.responseHeaders)
        && ng.isDefined(client.responseHeaders['x-intercom-email'])) {
        var update = {
          'email': client.responseHeaders['x-intercom-email'],
          'name': client.responseHeaders['x-intercom-full-name'],
          'user_id': client.responseHeaders['x-intercom-user-id'],
          'created_at': client.responseHeaders['x-intercom-created-at'],
          'user_hash': client.responseHeaders['x-intercom-user-hash'],
          'app_id': client.responseHeaders['x-intercom-api'],
          'increments': {
            'time': 1
          }
        };
        if (ng.isDefined(client.responseHeaders['x-intercom-custom'])) {
          ng.extend(update, JSON.parse(client.responseHeaders['x-intercom-custom']));
        }
        if (ng.isDefined(window.Intercom.isInitialized)) {
          window.Intercom('update', update);
        }
        else {
          window.Intercom('boot', update);
        }
      }
    }, 5000);
  }]);
});
