(function () {
  'use strict';
  import {gulp} from 'gulp';
  import * as ts from 'gulp-typescript';
  import * as sourcemaps from 'gulp-sourcemaps';
  import * as tslint from 'gulp-tslint';
  import * as terser from 'gulp-terser';
  import * as rename from 'gulp-rename';
  import {pump} from 'pump';
  import * as webpack from 'webpack-stream';
  import * as dtsBundleWebpack from 'dts-bundle-webpack';
  var tsProject = ts.createProject('tsconfig.json');
  var tsProject2015 = ts.createProject('tsconfig.json', {
    target: 'es2015',
    module: 'esnext'
  });

  gulp.task('build', gulp.series(function build() {
    return gulp.src([
      'src/**/*.ts',
      'microsoft.cognitiveservices.speech.sdk.ts'],
      { base: '.' })
      .pipe(tslint({
        formatter: 'prose',
        configuration: 'tslint.json'
      }))
      .pipe(tslint.report({
        summarizeFailureOutput: true
      }))
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('distrib/lib'));
  }, function () {
    return gulp.src('./external/**/*')
      .pipe(gulp.dest('./distrib/lib/external/'));
  }));

  gulp.task('build2015', gulp.series(function build() {
    return gulp.src([
      'src/**/*.ts',
      'microsoft.cognitiveservices.speech.sdk.ts'],
      { base: '.' })
      .pipe(tslint({
        formatter: 'prose',
        configuration: 'tslint.json'
      }))
      .pipe(tslint.report({
        summarizeFailureOutput: true
      }))
      .pipe(sourcemaps.init())
      .pipe(tsProject2015())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('distrib/es2015'));
  }, function () {
    return gulp.src('./external/**/*')
      .pipe(gulp.dest('./distrib/es2015/external/'));
  }));

  gulp.task('bundle', gulp.series('build', function bundle() {
    return gulp.src('bundleApp.js')
      .pipe(webpack({
        output: { filename: 'microsoft.cognitiveservices.speech.sdk.bundle.js' },
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
