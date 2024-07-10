(function () {
  'use strict';
  var gulp = require('gulp');
  var ts = require('gulp-typescript');
  var sourcemaps = require('gulp-sourcemaps');
  var eslint = require('gulp-eslint');
  var terser = require('gulp-terser');
  var rename = require('gulp-rename');
  var pump = require('pump');
  var webpack = require('webpack-stream');
  var dtsBundleWebpack = require('dts-bundle-webpack');
  var tsProject = ts.createProject('tsconfig.json');

  gulp.task('build', gulp.series(function build() {
    return gulp.src([
      'src/**/*.ts',
      'microsoft.cognitiveservices.speech.sdk.ts',
      '!src/common.browser/__mocks__/',
      '!src/common.browser/__mocks__/**'],
      { base: '.' })
      .pipe(eslint({
        formatter: 'prose',
        configuration: 'eslint.json'
      }))
      .pipe(eslint.format())
      .pipe(eslint.failAfterError())
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('distrib/lib'));
    }, function () {
      return gulp.src('./src/audioworklet/speech-processor.js')
        .pipe(gulp.dest('./distrib/lib/src/common.browser'));
  }));

  gulp.task('bundle', gulp.series('build', function bundle() {
    return gulp.src('bundleApp.js')
      .pipe(webpack({
        entry: {
          'microsoft.cognitiveservices.speech.sdk.bundle': './bundleApp.js',
        },
        output: {
          filename: '[name].js',
        },
        devtool: 'source-map',
        module: {
          rules: [{
            enforce: 'pre',
            test: /\.js$/,
            loader: 'source-map-loader'
          }],
        },
        mode: 'none',
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

  gulp.task('compress', gulp.series('bundle', function (cb) {
    return pump([
      gulp.src('distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js'),
      rename(function (path) { path.basename = 'microsoft.cognitiveservices.speech.sdk.bundle-min'; }),
      terser(),
      gulp.dest('distrib/browser')
    ],
      cb
    );
  }));
}());
