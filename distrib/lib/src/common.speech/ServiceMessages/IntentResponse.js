"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// response
Object.defineProperty(exports, "__esModule", { value: true });
var IntentResponse = /** @class */ (function () {
    function IntentResponse(json) {
        this.privIntentResponse = JSON.parse(json);
    }
    IntentResponse.fromJSON = function (json) {
        return new IntentResponse(json);
    };
    Object.defineProperty(IntentResponse.prototype, "query", {
        get: function () {
            return this.privIntentResponse.query;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IntentResponse.prototype, "topScoringIntent", {
        get: function () {
            return this.privIntentResponse.topScoringIntent;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IntentResponse.prototype, "entities", {
        get: function () {
            return this.privIntentResponse.entities;
        },
        enumerable: true,
        configurable: true
    });
    return IntentResponse;
}());
exports.IntentResponse = IntentResponse;

//# sourceMappingURL=IntentResponse.js.map
