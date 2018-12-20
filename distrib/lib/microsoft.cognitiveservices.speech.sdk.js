"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var Exports_1 = require("./src/common.browser/Exports");
var Exports_2 = require("./src/common/Exports");
// Common.Storage.SetLocalStorage(new Common.Browser.LocalStorage());
// Common.Storage.SetSessionStorage(new Common.Browser.SessionStorage());
Exports_2.Events.instance.attachListener(new Exports_1.ConsoleLoggingListener());
// Speech SDK API
__export(require("./src/sdk/Exports"));

//# sourceMappingURL=microsoft.cognitiveservices.speech.sdk.js.map
