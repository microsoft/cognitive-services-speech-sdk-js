// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts.js";

/**
 * Represents a keyword recognition model for recognizing when
 * the user says a keyword to initiate further speech recognition.
 * @class KeywordRecognitionModel
 */
export class KeywordRecognitionModel {
    private privDisposed: boolean = false;

    /**
     * Create and initializes a new instance.
     * @constructor
     */
    private constructor() {
        return;
    }

    /**
     * Creates a keyword recognition model using the specified filename.
     * @member KeywordRecognitionModel.fromFile
     * @function
     * @public
     * @param {string} fileName - A string that represents file name for the keyword recognition model.
     * Note, the file can point to a zip file in which case the model
     * will be extracted from the zip.
     * @returns {KeywordRecognitionModel} The keyword recognition model being created.
     */
    public static fromFile(fileName: string): KeywordRecognitionModel {
        Contracts.throwIfFileDoesNotExist(fileName, "fileName");

        throw new Error("Not yet implemented.");
    }

    /**
     * Creates a keyword recognition model using the specified filename.
     * @member KeywordRecognitionModel.fromStream
     * @function
     * @public
     * @param {string} file - A File that represents file for the keyword recognition model.
     * Note, the file can point to a zip file in which case the model will be extracted from the zip.
     * @returns {KeywordRecognitionModel} The keyword recognition model being created.
     */
    public static fromStream(file: File): KeywordRecognitionModel {
        Contracts.throwIfNull(file, "file");

        throw new Error("Not yet implemented.");
    }

    /**
     * Dispose of associated resources.
     * @member KeywordRecognitionModel.prototype.close
     * @function
     * @public
     */
    public close(): void {
        if (this.privDisposed) {
            return;
        }

        this.privDisposed = true;
    }
}
