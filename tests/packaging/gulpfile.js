(function () {
  'use strict';
  var gulp = require("gulp");
  var webpack = require('webpack-stream');
 
  gulp.task("bundle", function bundle() {
    return gulp.src('demoApp.js')
      .pipe(webpack({
        output: { filename: 'demoBundle.js' },
        mode: "none",
        }
    ))
      .pipe(gulp.dest('distrib'));
  });

}());
