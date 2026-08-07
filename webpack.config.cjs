// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
//
// Webpack config for the browser bundle. This was previously inlined inside
// `gulpfile.cjs` (task `bundle`) and wired through `webpack-stream`. It is now
// invoked directly via the `webpack` CLI (see the `build:bundle` npm script /
// turbo pipeline entry).

const path = require('node:path');
const DtsBundleWebpack = require('dts-bundle-webpack');

module.exports = {
  entry: {
    'microsoft.cognitiveservices.speech.sdk.bundle': './bundleApp.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'distrib', 'browser'),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  mode: 'none',
  plugins: [
    new DtsBundleWebpack({
      name: 'microsoft.cognitiveservices.speech.sdk.bundle',
      main: 'distrib/lib/microsoft.cognitiveservices.speech.sdk.d.ts',
      out: '~/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.d.ts',
      outputAsModuleFolder: true,
    }),
  ],
};
