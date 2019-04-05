(function () {
  'use strict';
  var gulp = require("gulp");
  var ts = require('gulp-typescript');
  var sourcemaps = require('gulp-sourcemaps');
  var tslint = require("gulp-tslint");
  var uglify = require('gulp-uglify');
  var rename = require('gulp-rename');
  var pump = require('pump');
  var webpack = require('webpack-stream');
  var dtsBundleWebpack = require('dts-bundle-webpack');

  gulp.task("build", function build() {
    return gulp.src([
      "src/**/*.ts",
      "microsoft.cognitiveservices.speech.sdk.ts"],
      { base: '.' })
      .pipe(tslint({
        formatter: "prose",
        configuration: "tslint.json"
      }))
      .pipe(tslint.report({
        summarizeFailureOutput: true
      }))
      .pipe(sourcemaps.init())
      .pipe(ts({
        target: "ES5",
        declaration: true,
        noImplicitAny: true,
        removeComments: false,
        outDir: 'distrib/lib'
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('distrib/lib'));
  });

  gulp.task("bundle", gulp.series("build", function bundle() {
    return gulp.src('bundleApp.js')
      .pipe(webpack({
        output: { filename: 'microsoft.cognitiveservices.speech.sdk.bundle.js' },
        devtool: 'source-map',
        module: {
          rules: [{
            enforce: 'pre',
            test: /\.js$/,
            loader: "source-map-loader"
          }],
        },
        plugins: [
          new dtsBundleWebpack({
            name: 'microsoft.cognitiveservices.speech.sdk.bundle',
            main: 'distrib/lib/microsoft.cognitiveservices.speech.sdk.d.ts',
            out: '~/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.d.ts',
            outputAsModuleFolder: true,
          })
        ]
      }))
      .pipe(gulp.dest('distrib/browser'));
  }, function () {
    return gulp.src('./src/audioworklet/speech-processor.js')
      .pipe(gulp.dest('./distrib/browser'));
  }));

  gulp.task('compress', gulp.series("bundle", function (cb) {
    return pump([
      gulp.src('distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js'),
      rename(function (path) { path.basename = "microsoft.cognitiveservices.speech.sdk.bundle-min"; }),
      uglify(),
      gulp.dest('distrib/browser')
    ],
      cb
    );
  }));
}());
