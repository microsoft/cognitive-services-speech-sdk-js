// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, ResultReason } from "./Exports.js";

/**
 * Base class for synthesis results
 * @class SynthesisResult
 * Added in version 1.20.0
 */
export class SynthesisResult {
    private privResultId: string;
    private privReason: ResultReason;
    private privErrorDetails: string;
    private privProperties: PropertyCollection;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    public constructor(resultId?: string, reason?: ResultReason, errorDetails?: string, properties?: PropertyCollection) {
        this.privResultId = resultId;
        this.privReason = reason;
        this.privErrorDetails = errorDetails;
        this.privProperties = properties;
    }

    /**
     * Specifies the result identifier.
     * @member SynthesisResult.prototype.resultId
     * @function
     * @public
     * @returns {string} Specifies the result identifier.
     */
    public get resultId(): string {
        return this.privResultId;
    }

    /**
     * Specifies status of the result.
     * @member SynthesisResult.prototype.reason
     * @function
     * @public
     * @returns {ResultReason} Specifies status of the result.
     */
    public get reason(): ResultReason {
        return this.privReason;
    }

    /**
     * In case of an unsuccessful synthesis, provides details of the occurred error.
     * @member SynthesisResult.prototype.errorDetails
     * @function
     * @public
     * @returns {string} a brief description of an error.
     */
    public get errorDetails(): string {
        return this.privErrorDetails;
    }

    /**
     * The set of properties exposed in the result.
     * @member SynthesisResult.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The set of properties exposed in the result.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }
}
