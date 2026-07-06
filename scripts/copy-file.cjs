#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
//
// Tiny cross-platform file copy helper used by the turbo pipeline to replicate
// the `gulp.src(...).pipe(gulp.dest(...))` copies that lived in gulpfile.cjs.

const { copyFileSync, mkdirSync } = require("node:fs");
const { dirname } = require("node:path");

const [src, dst] = process.argv.slice(2);
if (!src || !dst) {
  console.error("usage: copy-file.cjs <src> <dst>");
  process.exit(1);
}
mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log(`copied ${src} -> ${dst}`);
