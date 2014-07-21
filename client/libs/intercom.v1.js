(function(){
  var per_app_intercom_widget;

  if (typeof(window.intercomSettings) === 'undefined' || typeof(window.intercomSettings.app_id) === 'undefined') {
    per_app_intercom_widget = 'https://widget.intercom.io/widget/';
  } else {
    per_app_intercom_widget = 'https://widget.intercom.io/widget/' + window.intercomSettings.app_id;
  }

  var script_tag = document.createElement('script');
  script_tag.type = 'text/javascript';
  script_tag.async = true;
  script_tag.src = per_app_intercom_widget;

  var existing_script = document.getElementsByTagName('script')[0];
  existing_script.parentNode.insertBefore(script_tag, existing_script);
})();