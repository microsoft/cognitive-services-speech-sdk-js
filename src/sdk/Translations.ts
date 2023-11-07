// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection } from "./Exports.js";

/**
 * Represents collection of parameters and their values.
 * @class Translations
 */
export class Translations {
    // Use an PropertyCollection internally, just wrapping it to hide the | enum syntax it has.
    private privMap: PropertyCollection = new PropertyCollection();

    /**
     * Get the languages in the object in a String array.
     * @member Translations.prototype.languages
     * @function
     * @public
     * @returns {string[]} languages in translations object.
     */
    public get languages(): string[] {
        return this.privMap.keys;
    }

    /**
     * Returns the parameter value in type String. The parameter must have the same type as String.
     * Currently only String, int and bool are allowed.
     * If the name is not available, the specified defaultValue is returned.
     * @member Translations.prototype.get
     * @function
     * @public
     * @param {string} key - The parameter name.
     * @param {string} def - The default value which is returned if the parameter is not available in the collection.
     * @returns {string} value of the parameter.
     */
    public get(key: string, def?: string): string {
        return this.privMap.getProperty(key, def);
    }

    /**
     * Sets the String value of the parameter specified by name.
     * @member Translations.prototype.set
     * @function
     * @public
     * @param {string} key - The parameter name.
     * @param {string} value - The value of the parameter.
     */
    public set(key: string, value: string): void {
        this.privMap.setProperty(key, value);
    }
}
