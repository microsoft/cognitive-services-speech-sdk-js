"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("./Exports");
/**
 * Defines payload for session events like Speech Start/End Detected
 * @class
 */
var RecognitionEventArgs = /** @class */ (function (_super) {
    __extends(RecognitionEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    function RecognitionEventArgs(offset, sessionId) {
        var _this = _super.call(this, sessionId) || this;
        _this.privOffset = offset;
        return _this;
    }
    Object.defineProperty(RecognitionEventArgs.prototype, "offset", {
        /**
         * Represents the message offset
         * @member RecognitionEventArgs.prototype.offset
         * @function
         * @public
         */
        get: function () {
            return this.privOffset;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionEventArgs;
}(Exports_1.SessionEventArgs));
exports.RecognitionEventArgs = RecognitionEventArgs;

//# sourceMappingURL=RecognitionEventArgs.js.map
