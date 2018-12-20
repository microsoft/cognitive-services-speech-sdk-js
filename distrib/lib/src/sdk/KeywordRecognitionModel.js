"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Contracts_1 = require("./Contracts");
/**
 * Represents a keyword recognition model for recognizing when
 * the user says a keyword to initiate further speech recognition.
 * @class KeywordRecognitionModel
 */
var KeywordRecognitionModel = /** @class */ (function () {
    /**
     * Create and initializes a new instance.
     * @constructor
     */
    function KeywordRecognitionModel() {
        this.privDisposed = false;
    }
    /**
     * Creates a keyword recognition model using the specified filename.
     * @member KeywordRecognitionModel.fromFile
     * @function
     * @public
     * @param {string} fileName - A string that represents file name for the keyword recognition model.
     *        Note, the file can point to a zip file in which case the model
     *        will be extracted from the zip.
     * @returns {KeywordRecognitionModel} The keyword recognition model being created.
     */
    KeywordRecognitionModel.fromFile = function (fileName) {
        Contracts_1.Contracts.throwIfFileDoesNotExist(fileName, "fileName");
        throw new Error("Not yet implemented.");
    };
    /**
     * Creates a keyword recognition model using the specified filename.
     * @member KeywordRecognitionModel.fromStream
     * @function
     * @public
     * @param {string} file - A File that represents file for the keyword recognition model.
     *        Note, the file can point to a zip file in which case the model will be extracted from the zip.
     * @returns {KeywordRecognitionModel} The keyword recognition model being created.
     */
    KeywordRecognitionModel.fromStream = function (file) {
        Contracts_1.Contracts.throwIfNull(file, "file");
        throw new Error("Not yet implemented.");
    };
    /**
     * Dispose of associated resources.
     * @member KeywordRecognitionModel.prototype.close
     * @function
     * @public
     */
    KeywordRecognitionModel.prototype.close = function () {
        if (this.privDisposed) {
            return;
        }
        this.privDisposed = true;
    };
    return KeywordRecognitionModel;
}());
exports.KeywordRecognitionModel = KeywordRecognitionModel;

//# sourceMappingURL=KeywordRecognitionModel.js.map
