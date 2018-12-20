"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("./Exports");
/**
 * Represents collection of parameters and their values.
 * @class Translation
 */
var Translations = /** @class */ (function () {
    function Translations() {
        // Use an PropertyCollection internally, just wrapping it to hide the | enum syntax it has.
        this.privMap = new Exports_1.PropertyCollection();
    }
    /**
     * Returns the parameter value in type String. The parameter must have the same type as String.
     * Currently only String, int and bool are allowed.
     * If the name is not available, the specified defaultValue is returned.
     * @member Translation.prototype.get
     * @function
     * @public
     * @param {string} key - The parameter name.
     * @param {string} def - The default value which is returned if the parameter is not available in the collection.
     * @returns {string} value of the parameter.
     */
    Translations.prototype.get = function (key, def) {
        return this.privMap.getProperty(key, def);
    };
    /**
     * Sets the String value of the parameter specified by name.
     * @member Translation.prototype.set
     * @function
     * @public
     * @param {string} key - The parameter name.
     * @param {string} value - The value of the parameter.
     */
    Translations.prototype.set = function (key, value) {
        this.privMap.setProperty(key, value);
    };
    return Translations;
}());
exports.Translations = Translations;

//# sourceMappingURL=Translations.js.map
