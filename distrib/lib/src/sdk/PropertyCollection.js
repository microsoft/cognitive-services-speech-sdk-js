"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("./Exports");
/**
 * Represents collection of properties and their values.
 * @class PropertyCollection
 */
var PropertyCollection = /** @class */ (function () {
    function PropertyCollection() {
        this.privKeys = [];
        this.privValues = [];
    }
    /**
     * Returns the property value in type String. The parameter must have the same type as String.
     * Currently only String, int and bool are allowed.
     * If the name is not available, the specified defaultValue is returned.
     * @member PropertyCollection.prototype.getProperty
     * @function
     * @public
     * @param {string} key - The parameter name.
     * @param {string} def - The default value which is returned if the parameter
     *        is not available in the collection.
     * @returns {string} value of the parameter.
     */
    PropertyCollection.prototype.getProperty = function (key, def) {
        var keyToUse;
        if (typeof key === "string") {
            keyToUse = key;
        }
        else {
            keyToUse = Exports_1.PropertyId[key];
        }
        for (var n = 0; n < this.privKeys.length; n++) {
            if (this.privKeys[n] === keyToUse) {
                return this.privValues[n];
            }
        }
        return def;
    };
    /**
     * Sets the String value of the parameter specified by name.
     * @member PropertyCollection.prototype.setProperty
     * @function
     * @public
     * @param {string} key - The parameter name.
     * @param {string} value - The value of the parameter.
     */
    PropertyCollection.prototype.setProperty = function (key, value) {
        var keyToUse;
        if (typeof key === "string") {
            keyToUse = key;
        }
        else {
            keyToUse = Exports_1.PropertyId[key];
        }
        for (var n = 0; n < this.privKeys.length; n++) {
            if (this.privKeys[n] === keyToUse) {
                this.privValues[n] = value;
                return;
            }
        }
        this.privKeys.push(keyToUse);
        this.privValues.push(value);
    };
    /**
     * Clones the collection.
     * @member PropertyCollection.prototype.clone
     * @function
     * @public
     * @returns {PropertyCollection} A copy of the collection.
     */
    PropertyCollection.prototype.clone = function () {
        var clonedMap = new PropertyCollection();
        for (var n = 0; n < this.privKeys.length; n++) {
            clonedMap.privKeys.push(this.privKeys[n]);
            clonedMap.privValues.push(this.privValues[n]);
        }
        return clonedMap;
    };
    return PropertyCollection;
}());
exports.PropertyCollection = PropertyCollection;

//# sourceMappingURL=PropertyCollection.js.map
