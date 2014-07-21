module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      std: {
        options: {
          baseUrl: "./client/js/",
          mainConfigFile: "./client/js/main.js",
          name: 'main',
          optimize: 'uglify2',
          out: "./client/build/main.js",
          removeCombined: true,
          findNestedDependencies: true,
          generateSourceMaps: true,
          preserveLicenseComments: false
        }
      },
      dev: {
        options: {
          baseUrl: "./client/js/",
          mainConfigFile: "./client/js/main.js",
          name: 'main',
          optimize: 'none',
          out: "./client/build/main.js",
//          removeCombined: true,
          findNestedDependencies: true
//          generateSourceMaps: true,
//          preserveLicenseComments: false
        }
      }
    },
    concat: {
      css: {
        src: [
          'client/client.css',
          'client/css/bootstrap.min.css',
          'client/css/bootstrap-theme.min.css'
        ],
        dest: 'client/build/combined.css'
      }
    },
    cssmin : {
      css:{
        src: 'client/build/combined.css',
        dest: 'client/build/combined.min.css'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('build', ['requirejs:std']);
  grunt.registerTask('dev', ['requirejs:dev']);
  grunt.registerTask('css', ['concat:css', 'cssmin:css']);

};