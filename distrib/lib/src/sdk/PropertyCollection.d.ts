import { PropertyId } from "./Exports";
/**
 * Represents collection of properties and their values.
 * @class PropertyCollection
 */
export declare class PropertyCollection {
    private privKeys;
    private privValues;
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
    getProperty(key: PropertyId | string, def?: string): string;
    /**
     * Sets the String value of the parameter specified by name.
     * @member PropertyCollection.prototype.setProperty
     * @function
     * @public
     * @param {string} key - The parameter name.
     * @param {string} value - The value of the parameter.
     */
    setProperty(key: string | PropertyId, value: string): void;
    /**
     * Clones the collection.
     * @member PropertyCollection.prototype.clone
     * @function
     * @public
     * @returns {PropertyCollection} A copy of the collection.
     */
    clone(): PropertyCollection;
}
