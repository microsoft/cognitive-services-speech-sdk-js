"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var createGuid = function () {
    var d = new Date().getTime();
    var guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return guid;
};
exports.createGuid = createGuid;
var createNoDashGuid = function () {
    return createGuid().replace(new RegExp("-", "g"), "").toUpperCase();
};
exports.createNoDashGuid = createNoDashGuid;

//# sourceMappingURL=Guid.js.map
