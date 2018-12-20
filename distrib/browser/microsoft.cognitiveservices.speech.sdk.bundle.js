/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 21);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var AudioConfig_1 = __webpack_require__(42);
exports.AudioConfig = AudioConfig_1.AudioConfig;
var AudioStreamFormat_1 = __webpack_require__(7);
exports.AudioStreamFormat = AudioStreamFormat_1.AudioStreamFormat;
var AudioInputStream_1 = __webpack_require__(19);
exports.AudioInputStream = AudioInputStream_1.AudioInputStream;
exports.PullAudioInputStream = AudioInputStream_1.PullAudioInputStream;
exports.PushAudioInputStream = AudioInputStream_1.PushAudioInputStream;
var CancellationReason_1 = __webpack_require__(43);
exports.CancellationReason = CancellationReason_1.CancellationReason;
var PullAudioInputStreamCallback_1 = __webpack_require__(44);
exports.PullAudioInputStreamCallback = PullAudioInputStreamCallback_1.PullAudioInputStreamCallback;
var KeywordRecognitionModel_1 = __webpack_require__(45);
exports.KeywordRecognitionModel = KeywordRecognitionModel_1.KeywordRecognitionModel;
var SessionEventArgs_1 = __webpack_require__(46);
exports.SessionEventArgs = SessionEventArgs_1.SessionEventArgs;
var RecognitionEventArgs_1 = __webpack_require__(47);
exports.RecognitionEventArgs = RecognitionEventArgs_1.RecognitionEventArgs;
var OutputFormat_1 = __webpack_require__(48);
exports.OutputFormat = OutputFormat_1.OutputFormat;
var IntentRecognitionEventArgs_1 = __webpack_require__(49);
exports.IntentRecognitionEventArgs = IntentRecognitionEventArgs_1.IntentRecognitionEventArgs;
var RecognitionResult_1 = __webpack_require__(50);
exports.RecognitionResult = RecognitionResult_1.RecognitionResult;
var SpeechRecognitionResult_1 = __webpack_require__(51);
exports.SpeechRecognitionResult = SpeechRecognitionResult_1.SpeechRecognitionResult;
var IntentRecognitionResult_1 = __webpack_require__(52);
exports.IntentRecognitionResult = IntentRecognitionResult_1.IntentRecognitionResult;
var LanguageUnderstandingModel_1 = __webpack_require__(53);
exports.LanguageUnderstandingModel = LanguageUnderstandingModel_1.LanguageUnderstandingModel;
var SpeechRecognitionEventArgs_1 = __webpack_require__(54);
exports.SpeechRecognitionEventArgs = SpeechRecognitionEventArgs_1.SpeechRecognitionEventArgs;
var SpeechRecognitionCanceledEventArgs_1 = __webpack_require__(55);
exports.SpeechRecognitionCanceledEventArgs = SpeechRecognitionCanceledEventArgs_1.SpeechRecognitionCanceledEventArgs;
var TranslationRecognitionEventArgs_1 = __webpack_require__(56);
exports.TranslationRecognitionEventArgs = TranslationRecognitionEventArgs_1.TranslationRecognitionEventArgs;
var TranslationSynthesisEventArgs_1 = __webpack_require__(57);
exports.TranslationSynthesisEventArgs = TranslationSynthesisEventArgs_1.TranslationSynthesisEventArgs;
var TranslationRecognitionResult_1 = __webpack_require__(58);
exports.TranslationRecognitionResult = TranslationRecognitionResult_1.TranslationRecognitionResult;
var TranslationSynthesisResult_1 = __webpack_require__(59);
exports.TranslationSynthesisResult = TranslationSynthesisResult_1.TranslationSynthesisResult;
var ResultReason_1 = __webpack_require__(60);
exports.ResultReason = ResultReason_1.ResultReason;
var SpeechConfig_1 = __webpack_require__(61);
exports.SpeechConfig = SpeechConfig_1.SpeechConfig;
var SpeechTranslationConfig_1 = __webpack_require__(87);
exports.SpeechTranslationConfig = SpeechTranslationConfig_1.SpeechTranslationConfig;
var PropertyCollection_1 = __webpack_require__(88);
exports.PropertyCollection = PropertyCollection_1.PropertyCollection;
var PropertyId_1 = __webpack_require__(89);
exports.PropertyId = PropertyId_1.PropertyId;
var Recognizer_1 = __webpack_require__(90);
exports.Recognizer = Recognizer_1.Recognizer;
var SpeechRecognizer_1 = __webpack_require__(91);
exports.SpeechRecognizer = SpeechRecognizer_1.SpeechRecognizer;
var IntentRecognizer_1 = __webpack_require__(92);
exports.IntentRecognizer = IntentRecognizer_1.IntentRecognizer;
var TranslationRecognizer_1 = __webpack_require__(93);
exports.TranslationRecognizer = TranslationRecognizer_1.TranslationRecognizer;
var Translations_1 = __webpack_require__(94);
exports.Translations = Translations_1.Translations;
var NoMatchReason_1 = __webpack_require__(95);
exports.NoMatchReason = NoMatchReason_1.NoMatchReason;
var NoMatchDetails_1 = __webpack_require__(96);
exports.NoMatchDetails = NoMatchDetails_1.NoMatchDetails;
var TranslationRecognitionCanceledEventArgs_1 = __webpack_require__(97);
exports.TranslationRecognitionCanceledEventArgs = TranslationRecognitionCanceledEventArgs_1.TranslationRecognitionCanceledEventArgs;
var IntentRecognitionCanceledEventArgs_1 = __webpack_require__(98);
exports.IntentRecognitionCanceledEventArgs = IntentRecognitionCanceledEventArgs_1.IntentRecognitionCanceledEventArgs;
var CancellationDetails_1 = __webpack_require__(99);
exports.CancellationDetails = CancellationDetails_1.CancellationDetails;
var CancellationErrorCodes_1 = __webpack_require__(100);
exports.CancellationErrorCode = CancellationErrorCodes_1.CancellationErrorCode;



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(24));
__export(__webpack_require__(25));
__export(__webpack_require__(12));
__export(__webpack_require__(26));
__export(__webpack_require__(3));
__export(__webpack_require__(27));
__export(__webpack_require__(13));
__export(__webpack_require__(5));
__export(__webpack_require__(28));
__export(__webpack_require__(14));
__export(__webpack_require__(15));
__export(__webpack_require__(8));
__export(__webpack_require__(16));
__export(__webpack_require__(17));
__export(__webpack_require__(29));
__export(__webpack_require__(30));
__export(__webpack_require__(31));
__export(__webpack_require__(32));
var TranslationStatus_1 = __webpack_require__(9);
exports.TranslationStatus = TranslationStatus_1.TranslationStatus;



/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// Make sure not to export internal modules.
//
__export(__webpack_require__(62));
__export(__webpack_require__(63));
__export(__webpack_require__(10));
__export(__webpack_require__(64));
__export(__webpack_require__(11));
__export(__webpack_require__(65));
__export(__webpack_require__(67));
__export(__webpack_require__(68));
__export(__webpack_require__(20));
__export(__webpack_require__(70));
__export(__webpack_require__(71));
__export(__webpack_require__(72));
__export(__webpack_require__(73));
__export(__webpack_require__(74));
__export(__webpack_require__(75));
__export(__webpack_require__(76));
__export(__webpack_require__(77));
__export(__webpack_require__(78));
__export(__webpack_require__(79));
__export(__webpack_require__(80));
__export(__webpack_require__(81));
__export(__webpack_require__(82));
__export(__webpack_require__(83));
__export(__webpack_require__(84));
__export(__webpack_require__(85));
exports.OutputFormatPropertyName = "OutputFormat";
exports.CancellationErrorCodePropertyName = "CancellationErrorCode";



/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

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
/**
 * The error that is thrown when an argument passed in is null.
 *
 * @export
 * @class ArgumentNullError
 * @extends {Error}
 */
var ArgumentNullError = /** @class */ (function (_super) {
    __extends(ArgumentNullError, _super);
    /**
     * Creates an instance of ArgumentNullError.
     *
     * @param {string} argumentName - Name of the argument that is null
     *
     * @memberOf ArgumentNullError
     */
    function ArgumentNullError(argumentName) {
        var _this = _super.call(this, argumentName) || this;
        _this.name = "ArgumentNull";
        _this.message = argumentName;
        return _this;
    }
    return ArgumentNullError;
}(Error));
exports.ArgumentNullError = ArgumentNullError;
/**
 * The error that is thrown when an invalid operation is performed in the code.
 *
 * @export
 * @class InvalidOperationError
 * @extends {Error}
 */
// tslint:disable-next-line:max-classes-per-file
var InvalidOperationError = /** @class */ (function (_super) {
    __extends(InvalidOperationError, _super);
    /**
     * Creates an instance of InvalidOperationError.
     *
     * @param {string} error - The error
     *
     * @memberOf InvalidOperationError
     */
    function InvalidOperationError(error) {
        var _this = _super.call(this, error) || this;
        _this.name = "InvalidOperation";
        _this.message = error;
        return _this;
    }
    return InvalidOperationError;
}(Error));
exports.InvalidOperationError = InvalidOperationError;
/**
 * The error that is thrown when an object is disposed.
 *
 * @export
 * @class ObjectDisposedError
 * @extends {Error}
 */
// tslint:disable-next-line:max-classes-per-file
var ObjectDisposedError = /** @class */ (function (_super) {
    __extends(ObjectDisposedError, _super);
    /**
     * Creates an instance of ObjectDisposedError.
     *
     * @param {string} objectName - The object that is disposed
     * @param {string} error - The error
     *
     * @memberOf ObjectDisposedError
     */
    function ObjectDisposedError(objectName, error) {
        var _this = _super.call(this, error) || this;
        _this.name = objectName + "ObjectDisposed";
        _this.message = error;
        return _this;
    }
    return ObjectDisposedError;
}(Error));
exports.ObjectDisposedError = ObjectDisposedError;



/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class Contracts
 * @private
 */
var Contracts = /** @class */ (function () {
    function Contracts() {
    }
    Contracts.throwIfNullOrUndefined = function (param, name) {
        if (param === undefined || param === null) {
            throw new Error("throwIfNullOrUndefined:" + name);
        }
    };
    Contracts.throwIfNull = function (param, name) {
        if (param === null) {
            throw new Error("throwIfNull:" + name);
        }
    };
    Contracts.throwIfNullOrWhitespace = function (param, name) {
        Contracts.throwIfNullOrUndefined(param, name);
        if (("" + param).trim().length < 1) {
            throw new Error("throwIfNullOrWhitespace:" + name);
        }
    };
    Contracts.throwIfDisposed = function (isDisposed) {
        if (isDisposed) {
            throw new Error("the object is already disposed");
        }
    };
    Contracts.throwIfArrayEmptyOrWhitespace = function (array, name) {
        Contracts.throwIfNullOrUndefined(array, name);
        if (array.length === 0) {
            throw new Error("throwIfArrayEmptyOrWhitespace:" + name);
        }
        for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
            var item = array_1[_i];
            Contracts.throwIfNullOrWhitespace(item, name);
        }
    };
    Contracts.throwIfFileDoesNotExist = function (param, name) {
        Contracts.throwIfNullOrWhitespace(param, name);
        // TODO check for file existence.
    };
    return Contracts;
}());
exports.Contracts = Contracts;



/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

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



/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(23));
__export(__webpack_require__(33));
__export(__webpack_require__(34));
__export(__webpack_require__(35));
__export(__webpack_require__(36));
__export(__webpack_require__(37));
__export(__webpack_require__(38));
__export(__webpack_require__(39));
__export(__webpack_require__(18));
__export(__webpack_require__(41));



/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

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
/**
 * Represents audio stream format used for custom audio input configurations.
 * @class AudioStreamFormat
 */
var AudioStreamFormat = /** @class */ (function () {
    function AudioStreamFormat() {
    }
    /**
     * Creates an audio stream format object representing the default audio stream
     * format (16KHz 16bit mono PCM).
     * @member AudioStreamFormat.getDefaultInputFormat
     * @function
     * @public
     * @returns {AudioStreamFormat} The audio stream format being created.
     */
    AudioStreamFormat.getDefaultInputFormat = function () {
        return AudioStreamFormatImpl.getDefaultInputFormat();
    };
    /**
     * Creates an audio stream format object with the specified pcm waveformat characteristics.
     * @member AudioStreamFormat.getWaveFormatPCM
     * @function
     * @public
     * @param {number} samplesPerSecond - Sample rate, in samples per second (Hertz).
     * @param {number} bitsPerSample - Bits per sample, typically 16.
     * @param {number} channels - Number of channels in the waveform-audio data. Monaural data
     *        uses one channel and stereo data uses two channels.
     * @returns {AudioStreamFormat} The audio stream format being created.
     */
    AudioStreamFormat.getWaveFormatPCM = function (samplesPerSecond, bitsPerSample, channels) {
        return new AudioStreamFormatImpl(samplesPerSecond, bitsPerSample, channels);
    };
    return AudioStreamFormat;
}());
exports.AudioStreamFormat = AudioStreamFormat;
/**
 * @private
 * @class AudioStreamFormatImpl
 */
// tslint:disable-next-line:max-classes-per-file
var AudioStreamFormatImpl = /** @class */ (function (_super) {
    __extends(AudioStreamFormatImpl, _super);
    /**
     * Creates an instance with the given values.
     * @constructor
     * @param {number} samplesPerSec - Samples per second.
     * @param {number} bitsPerSample - Bits per sample.
     * @param {number} channels - Number of channels.
     */
    function AudioStreamFormatImpl(samplesPerSec, bitsPerSample, channels) {
        if (samplesPerSec === void 0) { samplesPerSec = 16000; }
        if (bitsPerSample === void 0) { bitsPerSample = 16; }
        if (channels === void 0) { channels = 1; }
        var _this = _super.call(this) || this;
        _this.formatTag = 1;
        _this.bitsPerSample = bitsPerSample;
        _this.samplesPerSec = samplesPerSec;
        _this.channels = channels;
        _this.avgBytesPerSec = _this.samplesPerSec * _this.channels * (_this.bitsPerSample / 8);
        _this.blockAlign = _this.channels * Math.max(_this.bitsPerSample, 8);
        return _this;
    }
    /**
     * Retrieves the default input format.
     * @member AudioStreamFormatImpl.getDefaultInputFormat
     * @function
     * @public
     * @returns {AudioStreamFormatImpl} The default input format.
     */
    AudioStreamFormatImpl.getDefaultInputFormat = function () {
        return new AudioStreamFormatImpl();
    };
    /**
     * Closes the configuration object.
     * @member AudioStreamFormatImpl.prototype.close
     * @function
     * @public
     */
    AudioStreamFormatImpl.prototype.close = function () { return; };
    return AudioStreamFormatImpl;
}(AudioStreamFormat));
exports.AudioStreamFormatImpl = AudioStreamFormatImpl;



/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Guid_1 = __webpack_require__(5);
var EventType;
(function (EventType) {
    EventType[EventType["Debug"] = 0] = "Debug";
    EventType[EventType["Info"] = 1] = "Info";
    EventType[EventType["Warning"] = 2] = "Warning";
    EventType[EventType["Error"] = 3] = "Error";
})(EventType = exports.EventType || (exports.EventType = {}));
var PlatformEvent = /** @class */ (function () {
    function PlatformEvent(eventName, eventType) {
        this.privName = eventName;
        this.privEventId = Guid_1.createNoDashGuid();
        this.privEventTime = new Date().toISOString();
        this.privEventType = eventType;
        this.privMetadata = {};
    }
    Object.defineProperty(PlatformEvent.prototype, "name", {
        get: function () {
            return this.privName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "eventId", {
        get: function () {
            return this.privEventId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "eventTime", {
        get: function () {
            return this.privEventTime;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "eventType", {
        get: function () {
            return this.privEventType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "metadata", {
        get: function () {
            return this.privMetadata;
        },
        enumerable: true,
        configurable: true
    });
    return PlatformEvent;
}());
exports.PlatformEvent = PlatformEvent;



/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines translation status.
 * @class TranslationStatus
 */
var TranslationStatus;
(function (TranslationStatus) {
    /**
     * @member TranslationStatus.Success
     */
    TranslationStatus[TranslationStatus["Success"] = 0] = "Success";
    /**
     * @member TranslationStatus.Error
     */
    TranslationStatus[TranslationStatus["Error"] = 1] = "Error";
})(TranslationStatus = exports.TranslationStatus || (exports.TranslationStatus = {}));



/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var AuthInfo = /** @class */ (function () {
    function AuthInfo(headerName, token) {
        this.privHeaderName = headerName;
        this.privToken = token;
    }
    Object.defineProperty(AuthInfo.prototype, "headerName", {
        get: function () {
            return this.privHeaderName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthInfo.prototype, "token", {
        get: function () {
            return this.privToken;
        },
        enumerable: true,
        configurable: true
    });
    return AuthInfo;
}());
exports.AuthInfo = AuthInfo;



/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(1);
var SpeechRecognitionEvent = /** @class */ (function (_super) {
    __extends(SpeechRecognitionEvent, _super);
    function SpeechRecognitionEvent(eventName, requestId, sessionId, eventType) {
        if (eventType === void 0) { eventType = Exports_1.EventType.Info; }
        var _this = _super.call(this, eventName, eventType) || this;
        _this.privRequestId = requestId;
        _this.privSessionId = sessionId;
        return _this;
    }
    Object.defineProperty(SpeechRecognitionEvent.prototype, "requestId", {
        get: function () {
            return this.privRequestId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognitionEvent.prototype, "sessionId", {
        get: function () {
            return this.privSessionId;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechRecognitionEvent;
}(Exports_1.PlatformEvent));
exports.SpeechRecognitionEvent = SpeechRecognitionEvent;
// tslint:disable-next-line:max-classes-per-file
var RecognitionTriggeredEvent = /** @class */ (function (_super) {
    __extends(RecognitionTriggeredEvent, _super);
    function RecognitionTriggeredEvent(requestId, sessionId, audioSourceId, audioNodeId) {
        var _this = _super.call(this, "RecognitionTriggeredEvent", requestId, sessionId) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        return _this;
    }
    Object.defineProperty(RecognitionTriggeredEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionTriggeredEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionTriggeredEvent;
}(SpeechRecognitionEvent));
exports.RecognitionTriggeredEvent = RecognitionTriggeredEvent;
// tslint:disable-next-line:max-classes-per-file
var ListeningStartedEvent = /** @class */ (function (_super) {
    __extends(ListeningStartedEvent, _super);
    function ListeningStartedEvent(requestId, sessionId, audioSourceId, audioNodeId) {
        var _this = _super.call(this, "ListeningStartedEvent", requestId, sessionId) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        return _this;
    }
    Object.defineProperty(ListeningStartedEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ListeningStartedEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    return ListeningStartedEvent;
}(SpeechRecognitionEvent));
exports.ListeningStartedEvent = ListeningStartedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectingToServiceEvent = /** @class */ (function (_super) {
    __extends(ConnectingToServiceEvent, _super);
    function ConnectingToServiceEvent(requestId, authFetchEventid, sessionId) {
        var _this = _super.call(this, "ConnectingToServiceEvent", requestId, sessionId) || this;
        _this.privAuthFetchEventid = authFetchEventid;
        return _this;
    }
    Object.defineProperty(ConnectingToServiceEvent.prototype, "authFetchEventid", {
        get: function () {
            return this.privAuthFetchEventid;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectingToServiceEvent;
}(SpeechRecognitionEvent));
exports.ConnectingToServiceEvent = ConnectingToServiceEvent;
// tslint:disable-next-line:max-classes-per-file
var RecognitionStartedEvent = /** @class */ (function (_super) {
    __extends(RecognitionStartedEvent, _super);
    function RecognitionStartedEvent(requestId, audioSourceId, audioNodeId, authFetchEventId, sessionId) {
        var _this = _super.call(this, "RecognitionStartedEvent", requestId, sessionId) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        _this.privAuthFetchEventId = authFetchEventId;
        return _this;
    }
    Object.defineProperty(RecognitionStartedEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionStartedEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionStartedEvent.prototype, "authFetchEventId", {
        get: function () {
            return this.privAuthFetchEventId;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionStartedEvent;
}(SpeechRecognitionEvent));
exports.RecognitionStartedEvent = RecognitionStartedEvent;
var RecognitionCompletionStatus;
(function (RecognitionCompletionStatus) {
    RecognitionCompletionStatus[RecognitionCompletionStatus["Success"] = 0] = "Success";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AudioSourceError"] = 1] = "AudioSourceError";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AudioSourceTimeout"] = 2] = "AudioSourceTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AuthTokenFetchError"] = 3] = "AuthTokenFetchError";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AuthTokenFetchTimeout"] = 4] = "AuthTokenFetchTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["UnAuthorized"] = 5] = "UnAuthorized";
    RecognitionCompletionStatus[RecognitionCompletionStatus["ConnectTimeout"] = 6] = "ConnectTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["ConnectError"] = 7] = "ConnectError";
    RecognitionCompletionStatus[RecognitionCompletionStatus["ClientRecognitionActivityTimeout"] = 8] = "ClientRecognitionActivityTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["UnknownError"] = 9] = "UnknownError";
})(RecognitionCompletionStatus = exports.RecognitionCompletionStatus || (exports.RecognitionCompletionStatus = {}));
// tslint:disable-next-line:max-classes-per-file
var RecognitionEndedEvent = /** @class */ (function (_super) {
    __extends(RecognitionEndedEvent, _super);
    function RecognitionEndedEvent(requestId, audioSourceId, audioNodeId, authFetchEventId, sessionId, serviceTag, status, error) {
        var _this = _super.call(this, "RecognitionEndedEvent", requestId, sessionId, status === RecognitionCompletionStatus.Success ? Exports_1.EventType.Info : Exports_1.EventType.Error) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        _this.privAuthFetchEventId = authFetchEventId;
        _this.privStatus = status;
        _this.privError = error;
        _this.privServiceTag = serviceTag;
        return _this;
    }
    Object.defineProperty(RecognitionEndedEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "authFetchEventId", {
        get: function () {
            return this.privAuthFetchEventId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "serviceTag", {
        get: function () {
            return this.privServiceTag;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "status", {
        get: function () {
            return this.privStatus;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "error", {
        get: function () {
            return this.privError;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionEndedEvent;
}(SpeechRecognitionEvent));
exports.RecognitionEndedEvent = RecognitionEndedEvent;



/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var Guid_1 = __webpack_require__(5);
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Text"] = 0] = "Text";
    MessageType[MessageType["Binary"] = 1] = "Binary";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var ConnectionMessage = /** @class */ (function () {
    function ConnectionMessage(messageType, body, headers, id) {
        this.privBody = null;
        if (messageType === MessageType.Text && body && !(typeof (body) === "string")) {
            throw new Error_1.InvalidOperationError("Payload must be a string");
        }
        if (messageType === MessageType.Binary && body && !(body instanceof ArrayBuffer)) {
            throw new Error_1.InvalidOperationError("Payload must be ArrayBuffer");
        }
        this.privMessageType = messageType;
        this.privBody = body;
        this.privHeaders = headers ? headers : {};
        this.privId = id ? id : Guid_1.createNoDashGuid();
    }
    Object.defineProperty(ConnectionMessage.prototype, "messageType", {
        get: function () {
            return this.privMessageType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "headers", {
        get: function () {
            return this.privHeaders;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "body", {
        get: function () {
            return this.privBody;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "textBody", {
        get: function () {
            if (this.privMessageType === MessageType.Binary) {
                throw new Error_1.InvalidOperationError("Not supported for binary message");
            }
            return this.privBody;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "binaryBody", {
        get: function () {
            if (this.privMessageType === MessageType.Text) {
                throw new Error_1.InvalidOperationError("Not supported for text message");
            }
            return this.privBody;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionMessage;
}());
exports.ConnectionMessage = ConnectionMessage;



/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var Guid_1 = __webpack_require__(5);
var EventSource = /** @class */ (function () {
    function EventSource(metadata) {
        var _this = this;
        this.privEventListeners = {};
        this.privIsDisposed = false;
        this.onEvent = function (event) {
            if (_this.isDisposed()) {
                throw (new Error_1.ObjectDisposedError("EventSource"));
            }
            if (_this.metadata) {
                for (var paramName in _this.metadata) {
                    if (paramName) {
                        if (event.metadata) {
                            if (!event.metadata[paramName]) {
                                event.metadata[paramName] = _this.metadata[paramName];
                            }
                        }
                    }
                }
            }
            for (var eventId in _this.privEventListeners) {
                if (eventId && _this.privEventListeners[eventId]) {
                    _this.privEventListeners[eventId](event);
                }
            }
        };
        this.attach = function (onEventCallback) {
            var id = Guid_1.createNoDashGuid();
            _this.privEventListeners[id] = onEventCallback;
            return {
                detach: function () {
                    delete _this.privEventListeners[id];
                },
            };
        };
        this.attachListener = function (listener) {
            return _this.attach(listener.onEvent);
        };
        this.isDisposed = function () {
            return _this.privIsDisposed;
        };
        this.dispose = function () {
            _this.privEventListeners = null;
            _this.privIsDisposed = true;
        };
        this.privMetadata = metadata;
    }
    Object.defineProperty(EventSource.prototype, "metadata", {
        get: function () {
            return this.privMetadata;
        },
        enumerable: true,
        configurable: true
    });
    return EventSource;
}());
exports.EventSource = EventSource;



/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var InMemoryStorage = /** @class */ (function () {
    function InMemoryStorage() {
        var _this = this;
        this.privStore = {};
        this.get = function (key) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            return _this.privStore[key];
        };
        this.getOrAdd = function (key, valueToAdd) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            if (_this.privStore[key] === undefined) {
                _this.privStore[key] = valueToAdd;
            }
            return _this.privStore[key];
        };
        this.set = function (key, value) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            _this.privStore[key] = value;
        };
        this.remove = function (key) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            if (_this.privStore[key] !== undefined) {
                delete _this.privStore[key];
            }
        };
    }
    return InMemoryStorage;
}());
exports.InMemoryStorage = InMemoryStorage;



/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var List = /** @class */ (function () {
    function List(list) {
        var _this = this;
        this.privSubscriptionIdCounter = 0;
        this.privAddSubscriptions = {};
        this.privRemoveSubscriptions = {};
        this.privDisposedSubscriptions = {};
        this.privDisposeReason = null;
        this.get = function (itemIndex) {
            _this.throwIfDisposed();
            return _this.privList[itemIndex];
        };
        this.first = function () {
            return _this.get(0);
        };
        this.last = function () {
            return _this.get(_this.length() - 1);
        };
        this.add = function (item) {
            _this.throwIfDisposed();
            _this.insertAt(_this.privList.length, item);
        };
        this.insertAt = function (index, item) {
            _this.throwIfDisposed();
            if (index === 0) {
                _this.privList.unshift(item);
            }
            else if (index === _this.privList.length) {
                _this.privList.push(item);
            }
            else {
                _this.privList.splice(index, 0, item);
            }
            _this.triggerSubscriptions(_this.privAddSubscriptions);
        };
        this.removeFirst = function () {
            _this.throwIfDisposed();
            return _this.removeAt(0);
        };
        this.removeLast = function () {
            _this.throwIfDisposed();
            return _this.removeAt(_this.length() - 1);
        };
        this.removeAt = function (index) {
            _this.throwIfDisposed();
            return _this.remove(index, 1)[0];
        };
        this.remove = function (index, count) {
            _this.throwIfDisposed();
            var removedElements = _this.privList.splice(index, count);
            _this.triggerSubscriptions(_this.privRemoveSubscriptions);
            return removedElements;
        };
        this.clear = function () {
            _this.throwIfDisposed();
            _this.remove(0, _this.length());
        };
        this.length = function () {
            _this.throwIfDisposed();
            return _this.privList.length;
        };
        this.onAdded = function (addedCallback) {
            _this.throwIfDisposed();
            var subscriptionId = _this.privSubscriptionIdCounter++;
            _this.privAddSubscriptions[subscriptionId] = addedCallback;
            return {
                detach: function () {
                    delete _this.privAddSubscriptions[subscriptionId];
                },
            };
        };
        this.onRemoved = function (removedCallback) {
            _this.throwIfDisposed();
            var subscriptionId = _this.privSubscriptionIdCounter++;
            _this.privRemoveSubscriptions[subscriptionId] = removedCallback;
            return {
                detach: function () {
                    delete _this.privRemoveSubscriptions[subscriptionId];
                },
            };
        };
        this.onDisposed = function (disposedCallback) {
            _this.throwIfDisposed();
            var subscriptionId = _this.privSubscriptionIdCounter++;
            _this.privDisposedSubscriptions[subscriptionId] = disposedCallback;
            return {
                detach: function () {
                    delete _this.privDisposedSubscriptions[subscriptionId];
                },
            };
        };
        this.join = function (seperator) {
            _this.throwIfDisposed();
            return _this.privList.join(seperator);
        };
        this.toArray = function () {
            var cloneCopy = Array();
            _this.privList.forEach(function (val) {
                cloneCopy.push(val);
            });
            return cloneCopy;
        };
        this.any = function (callback) {
            _this.throwIfDisposed();
            if (callback) {
                return _this.where(callback).length() > 0;
            }
            else {
                return _this.length() > 0;
            }
        };
        this.all = function (callback) {
            _this.throwIfDisposed();
            return _this.where(callback).length() === _this.length();
        };
        this.forEach = function (callback) {
            _this.throwIfDisposed();
            for (var i = 0; i < _this.length(); i++) {
                callback(_this.privList[i], i);
            }
        };
        this.select = function (callback) {
            _this.throwIfDisposed();
            var selectList = [];
            for (var i = 0; i < _this.privList.length; i++) {
                selectList.push(callback(_this.privList[i], i));
            }
            return new List(selectList);
        };
        this.where = function (callback) {
            _this.throwIfDisposed();
            var filteredList = new List();
            for (var i = 0; i < _this.privList.length; i++) {
                if (callback(_this.privList[i], i)) {
                    filteredList.add(_this.privList[i]);
                }
            }
            return filteredList;
        };
        this.orderBy = function (compareFn) {
            _this.throwIfDisposed();
            var clonedArray = _this.toArray();
            var orderedArray = clonedArray.sort(compareFn);
            return new List(orderedArray);
        };
        this.orderByDesc = function (compareFn) {
            _this.throwIfDisposed();
            return _this.orderBy(function (a, b) { return compareFn(b, a); });
        };
        this.clone = function () {
            _this.throwIfDisposed();
            return new List(_this.toArray());
        };
        this.concat = function (list) {
            _this.throwIfDisposed();
            return new List(_this.privList.concat(list.toArray()));
        };
        this.concatArray = function (array) {
            _this.throwIfDisposed();
            return new List(_this.privList.concat(array));
        };
        this.isDisposed = function () {
            return _this.privList == null;
        };
        this.dispose = function (reason) {
            if (!_this.isDisposed()) {
                _this.privDisposeReason = reason;
                _this.privList = null;
                _this.privAddSubscriptions = null;
                _this.privRemoveSubscriptions = null;
                _this.triggerSubscriptions(_this.privDisposedSubscriptions);
            }
        };
        this.throwIfDisposed = function () {
            if (_this.isDisposed()) {
                throw new Error_1.ObjectDisposedError("List", _this.privDisposeReason);
            }
        };
        this.triggerSubscriptions = function (subscriptions) {
            if (subscriptions) {
                for (var subscriptionId in subscriptions) {
                    if (subscriptionId) {
                        subscriptions[subscriptionId]();
                    }
                }
            }
        };
        this.privList = [];
        // copy the list rather than taking as is.
        if (list) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var item = list_1[_i];
                this.privList.push(item);
            }
        }
    }
    return List;
}());
exports.List = List;



/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var PromiseState;
(function (PromiseState) {
    PromiseState[PromiseState["None"] = 0] = "None";
    PromiseState[PromiseState["Resolved"] = 1] = "Resolved";
    PromiseState[PromiseState["Rejected"] = 2] = "Rejected";
})(PromiseState = exports.PromiseState || (exports.PromiseState = {}));
var PromiseResult = /** @class */ (function () {
    function PromiseResult(promiseResultEventSource) {
        var _this = this;
        this.throwIfError = function () {
            if (_this.isError) {
                throw _this.error;
            }
        };
        promiseResultEventSource.on(function (result) {
            if (!_this.privIsCompleted) {
                _this.privIsCompleted = true;
                _this.privIsError = false;
                _this.privResult = result;
            }
        }, function (error) {
            if (!_this.privIsCompleted) {
                _this.privIsCompleted = true;
                _this.privIsError = true;
                _this.privError = error;
            }
        });
    }
    Object.defineProperty(PromiseResult.prototype, "isCompleted", {
        get: function () {
            return this.privIsCompleted;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseResult.prototype, "isError", {
        get: function () {
            return this.privIsError;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseResult.prototype, "error", {
        get: function () {
            return this.privError;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseResult.prototype, "result", {
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return PromiseResult;
}());
exports.PromiseResult = PromiseResult;
// tslint:disable-next-line:max-classes-per-file
var PromiseResultEventSource = /** @class */ (function () {
    function PromiseResultEventSource() {
        var _this = this;
        this.setResult = function (result) {
            _this.privOnSetResult(result);
        };
        this.setError = function (error) {
            _this.privOnSetError(error);
        };
        this.on = function (onSetResult, onSetError) {
            _this.privOnSetResult = onSetResult;
            _this.privOnSetError = onSetError;
        };
    }
    return PromiseResultEventSource;
}());
exports.PromiseResultEventSource = PromiseResultEventSource;
// tslint:disable-next-line:max-classes-per-file
var PromiseHelper = /** @class */ (function () {
    function PromiseHelper() {
    }
    PromiseHelper.whenAll = function (promises) {
        if (!promises || promises.length === 0) {
            throw new Error_1.ArgumentNullError("promises");
        }
        var deferred = new Deferred();
        var errors = [];
        var completedPromises = 0;
        var checkForCompletion = function () {
            completedPromises++;
            if (completedPromises === promises.length) {
                if (errors.length === 0) {
                    deferred.resolve(true);
                }
                else {
                    deferred.reject(errors.join(", "));
                }
            }
        };
        for (var _i = 0, promises_1 = promises; _i < promises_1.length; _i++) {
            var promise = promises_1[_i];
            promise.on(function (r) {
                checkForCompletion();
            }, function (e) {
                errors.push(e);
                checkForCompletion();
            });
        }
        return deferred.promise();
    };
    PromiseHelper.fromResult = function (result) {
        var deferred = new Deferred();
        deferred.resolve(result);
        return deferred.promise();
    };
    PromiseHelper.fromError = function (error) {
        var deferred = new Deferred();
        deferred.reject(error);
        return deferred.promise();
    };
    return PromiseHelper;
}());
exports.PromiseHelper = PromiseHelper;
// TODO: replace with ES6 promises
// tslint:disable-next-line:max-classes-per-file
var Promise = /** @class */ (function () {
    function Promise(sink) {
        var _this = this;
        this.result = function () {
            return _this.privSink.result;
        };
        this.continueWith = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationResult = continuationCallback(_this.privSink.result);
                    continuationDeferral.resolve(continuationResult);
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                try {
                    var continuationResult = continuationCallback(_this.privSink.result);
                    continuationDeferral.resolve(continuationResult);
                }
                catch (e) {
                    continuationDeferral.reject("'Error handler for error " + error + " threw error " + e + "'");
                }
            });
            return continuationDeferral.promise();
        };
        this.onSuccessContinueWith = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationResult = continuationCallback(r);
                    continuationDeferral.resolve(continuationResult);
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                continuationDeferral.reject(error);
            });
            return continuationDeferral.promise();
        };
        this.continueWithPromise = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationPromise = continuationCallback(_this.privSink.result);
                    if (!continuationPromise) {
                        throw new Error("'Continuation callback did not return promise'");
                    }
                    continuationPromise.on(function (continuationResult) {
                        continuationDeferral.resolve(continuationResult);
                    }, function (e) {
                        continuationDeferral.reject(e);
                    });
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                try {
                    var continuationPromise = continuationCallback(_this.privSink.result);
                    if (!continuationPromise) {
                        throw new Error("Continuation callback did not return promise");
                    }
                    continuationPromise.on(function (continuationResult) {
                        continuationDeferral.resolve(continuationResult);
                    }, function (e) {
                        continuationDeferral.reject(e);
                    });
                }
                catch (e) {
                    continuationDeferral.reject("'Error handler for error " + error + " threw error " + e + "'");
                }
            });
            return continuationDeferral.promise();
        };
        this.onSuccessContinueWithPromise = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationPromise = continuationCallback(r);
                    if (!continuationPromise) {
                        throw new Error("Continuation callback did not return promise");
                    }
                    continuationPromise.on(function (continuationResult) {
                        continuationDeferral.resolve(continuationResult);
                    }, function (e) {
                        continuationDeferral.reject(e);
                    });
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                continuationDeferral.reject(error);
            });
            return continuationDeferral.promise();
        };
        this.on = function (successCallback, errorCallback) {
            if (!successCallback) {
                throw new Error_1.ArgumentNullError("successCallback");
            }
            if (!errorCallback) {
                throw new Error_1.ArgumentNullError("errorCallback");
            }
            _this.privSink.on(successCallback, errorCallback);
            return _this;
        };
        this.finally = function (callback) {
            if (!callback) {
                throw new Error_1.ArgumentNullError("callback");
            }
            var callbackWrapper = function (_) {
                callback();
            };
            return _this.on(callbackWrapper, callbackWrapper);
        };
        this.privSink = sink;
    }
    return Promise;
}());
exports.Promise = Promise;
// tslint:disable-next-line:max-classes-per-file
var Deferred = /** @class */ (function () {
    function Deferred() {
        var _this = this;
        this.state = function () {
            return _this.privSink.state;
        };
        this.promise = function () {
            return _this.privPromise;
        };
        this.resolve = function (result) {
            _this.privSink.resolve(result);
            return _this;
        };
        this.reject = function (error) {
            _this.privSink.reject(error);
            return _this;
        };
        this.privSink = new Sink();
        this.privPromise = new Promise(this.privSink);
    }
    return Deferred;
}());
exports.Deferred = Deferred;
// tslint:disable-next-line:max-classes-per-file
var Sink = /** @class */ (function () {
    function Sink() {
        var _this = this;
        this.privState = PromiseState.None;
        this.privPromiseResult = null;
        this.privPromiseResultEvents = null;
        this.privSuccessHandlers = [];
        this.privErrorHandlers = [];
        this.resolve = function (result) {
            if (_this.privState !== PromiseState.None) {
                throw new Error("'Cannot resolve a completed promise'");
            }
            _this.privState = PromiseState.Resolved;
            _this.privPromiseResultEvents.setResult(result);
            for (var i = 0; i < _this.privSuccessHandlers.length; i++) {
                _this.executeSuccessCallback(result, _this.privSuccessHandlers[i], _this.privErrorHandlers[i]);
            }
            _this.detachHandlers();
        };
        this.reject = function (error) {
            if (_this.privState !== PromiseState.None) {
                throw new Error("'Cannot reject a completed promise'");
            }
            _this.privState = PromiseState.Rejected;
            _this.privPromiseResultEvents.setError(error);
            for (var _i = 0, _a = _this.privErrorHandlers; _i < _a.length; _i++) {
                var errorHandler = _a[_i];
                _this.executeErrorCallback(error, errorHandler);
            }
            _this.detachHandlers();
        };
        this.on = function (successCallback, errorCallback) {
            if (successCallback == null) {
                successCallback = function (r) { return; };
            }
            if (_this.privState === PromiseState.None) {
                _this.privSuccessHandlers.push(successCallback);
                _this.privErrorHandlers.push(errorCallback);
            }
            else {
                if (_this.privState === PromiseState.Resolved) {
                    _this.executeSuccessCallback(_this.privPromiseResult.result, successCallback, errorCallback);
                }
                else if (_this.privState === PromiseState.Rejected) {
                    _this.executeErrorCallback(_this.privPromiseResult.error, errorCallback);
                }
                _this.detachHandlers();
            }
        };
        this.executeSuccessCallback = function (result, successCallback, errorCallback) {
            try {
                successCallback(result);
            }
            catch (e) {
                _this.executeErrorCallback("'Unhandled callback error: " + e + "'", errorCallback);
            }
        };
        this.executeErrorCallback = function (error, errorCallback) {
            if (errorCallback) {
                try {
                    errorCallback(error);
                }
                catch (e) {
                    throw new Error("'Unhandled callback error: " + e + ". InnerError: " + error + "'");
                }
            }
            else {
                throw new Error("'Unhandled error: " + error + "'");
            }
        };
        this.detachHandlers = function () {
            _this.privErrorHandlers = [];
            _this.privSuccessHandlers = [];
        };
        this.privPromiseResultEvents = new PromiseResultEventSource();
        this.privPromiseResult = new PromiseResult(this.privPromiseResultEvents);
    }
    Object.defineProperty(Sink.prototype, "state", {
        get: function () {
            return this.privState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sink.prototype, "result", {
        get: function () {
            return this.privPromiseResult;
        },
        enumerable: true,
        configurable: true
    });
    return Sink;
}());
exports.Sink = Sink;



/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var List_1 = __webpack_require__(15);
var Promise_1 = __webpack_require__(16);
var SubscriberType;
(function (SubscriberType) {
    SubscriberType[SubscriberType["Dequeue"] = 0] = "Dequeue";
    SubscriberType[SubscriberType["Peek"] = 1] = "Peek";
})(SubscriberType || (SubscriberType = {}));
var Queue = /** @class */ (function () {
    function Queue(list) {
        var _this = this;
        this.privPromiseStore = new List_1.List();
        this.privIsDrainInProgress = false;
        this.privIsDisposing = false;
        this.privDisposeReason = null;
        this.enqueue = function (item) {
            _this.throwIfDispose();
            _this.enqueueFromPromise(Promise_1.PromiseHelper.fromResult(item));
        };
        this.enqueueFromPromise = function (promise) {
            _this.throwIfDispose();
            _this.privPromiseStore.add(promise);
            promise.finally(function () {
                while (_this.privPromiseStore.length() > 0) {
                    if (!_this.privPromiseStore.first().result().isCompleted) {
                        break;
                    }
                    else {
                        var p = _this.privPromiseStore.removeFirst();
                        if (!p.result().isError) {
                            _this.privList.add(p.result().result);
                        }
                        else {
                            // TODO: Log as warning.
                        }
                    }
                }
            });
        };
        this.dequeue = function () {
            _this.throwIfDispose();
            var deferredSubscriber = new Promise_1.Deferred();
            if (_this.privSubscribers) {
                _this.privSubscribers.add({ deferral: deferredSubscriber, type: SubscriberType.Dequeue });
                _this.drain();
            }
            return deferredSubscriber.promise();
        };
        this.peek = function () {
            _this.throwIfDispose();
            var deferredSubscriber = new Promise_1.Deferred();
            var subs = _this.privSubscribers;
            if (subs) {
                _this.privSubscribers.add({ deferral: deferredSubscriber, type: SubscriberType.Peek });
                _this.drain();
            }
            return deferredSubscriber.promise();
        };
        this.length = function () {
            _this.throwIfDispose();
            return _this.privList.length();
        };
        this.isDisposed = function () {
            return _this.privSubscribers == null;
        };
        this.drainAndDispose = function (pendingItemProcessor, reason) {
            if (!_this.isDisposed() && !_this.privIsDisposing) {
                _this.privDisposeReason = reason;
                _this.privIsDisposing = true;
                var subs = _this.privSubscribers;
                if (subs) {
                    while (subs.length() > 0) {
                        var subscriber = subs.removeFirst();
                        // TODO: this needs work (Resolve(null) instead?).
                        subscriber.deferral.resolve(undefined);
                        // subscriber.deferral.reject("Disposed");
                    }
                    // note: this block assumes cooperative multitasking, i.e.,
                    // between the if-statement and the assignment there are no
                    // thread switches.
                    // Reason is that between the initial const = this.; and this
                    // point there is the derral.resolve() operation that might have
                    // caused recursive calls to the Queue, especially, calling
                    // Dispose() on the queue alredy (which would reset the var
                    // here to null!).
                    // That should generally hold true for javascript...
                    if (_this.privSubscribers === subs) {
                        _this.privSubscribers = subs;
                    }
                }
                for (var _i = 0, _a = _this.privDetachables; _i < _a.length; _i++) {
                    var detachable = _a[_i];
                    detachable.detach();
                }
                if (_this.privPromiseStore.length() > 0 && pendingItemProcessor) {
                    return Promise_1.PromiseHelper
                        .whenAll(_this.privPromiseStore.toArray())
                        .continueWith(function () {
                        _this.privSubscribers = null;
                        _this.privList.forEach(function (item, index) {
                            pendingItemProcessor(item);
                        });
                        _this.privList = null;
                        return true;
                    });
                }
                else {
                    _this.privSubscribers = null;
                    _this.privList = null;
                }
            }
            return Promise_1.PromiseHelper.fromResult(true);
        };
        this.dispose = function (reason) {
            _this.drainAndDispose(null, reason);
        };
        this.drain = function () {
            if (!_this.privIsDrainInProgress && !_this.privIsDisposing) {
                _this.privIsDrainInProgress = true;
                var subs = _this.privSubscribers;
                var lists = _this.privList;
                if (subs && lists) {
                    while (lists.length() > 0 && subs.length() > 0 && !_this.privIsDisposing) {
                        var subscriber = subs.removeFirst();
                        if (subscriber.type === SubscriberType.Peek) {
                            subscriber.deferral.resolve(lists.first());
                        }
                        else {
                            var dequeuedItem = lists.removeFirst();
                            subscriber.deferral.resolve(dequeuedItem);
                        }
                    }
                    // note: this block assumes cooperative multitasking, i.e.,
                    // between the if-statement and the assignment there are no
                    // thread switches.
                    // Reason is that between the initial const = this.; and this
                    // point there is the derral.resolve() operation that might have
                    // caused recursive calls to the Queue, especially, calling
                    // Dispose() on the queue alredy (which would reset the var
                    // here to null!).
                    // That should generally hold true for javascript...
                    if (_this.privSubscribers === subs) {
                        _this.privSubscribers = subs;
                    }
                    // note: this block assumes cooperative multitasking, i.e.,
                    // between the if-statement and the assignment there are no
                    // thread switches.
                    // Reason is that between the initial const = this.; and this
                    // point there is the derral.resolve() operation that might have
                    // caused recursive calls to the Queue, especially, calling
                    // Dispose() on the queue alredy (which would reset the var
                    // here to null!).
                    // That should generally hold true for javascript...
                    if (_this.privList === lists) {
                        _this.privList = lists;
                    }
                }
                _this.privIsDrainInProgress = false;
            }
        };
        this.throwIfDispose = function () {
            if (_this.isDisposed()) {
                if (_this.privDisposeReason) {
                    throw new Error_1.InvalidOperationError(_this.privDisposeReason);
                }
                throw new Error_1.ObjectDisposedError("Queue");
            }
            else if (_this.privIsDisposing) {
                throw new Error_1.InvalidOperationError("Queue disposing");
            }
        };
        this.privList = list ? list : new List_1.List();
        this.privDetachables = [];
        this.privSubscribers = new List_1.List();
        this.privDetachables.push(this.privList.onAdded(this.drain));
    }
    return Queue;
}());
exports.Queue = Queue;



/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var Exports_1 = __webpack_require__(1);
var ws = __webpack_require__(40);
var WebsocketMessageAdapter = /** @class */ (function () {
    function WebsocketMessageAdapter(uri, connectionId, messageFormatter) {
        var _this = this;
        this.open = function () {
            if (_this.privConnectionState === Exports_1.ConnectionState.Disconnected) {
                return Exports_1.PromiseHelper.fromError("Cannot open a connection that is in " + _this.privConnectionState + " state");
            }
            if (_this.privConnectionEstablishDeferral) {
                return _this.privConnectionEstablishDeferral.promise();
            }
            _this.privConnectionEstablishDeferral = new Exports_1.Deferred();
            _this.privConnectionState = Exports_1.ConnectionState.Connecting;
            try {
                if (typeof WebSocket !== "undefined" && !WebsocketMessageAdapter.forceNpmWebSocket) {
                    _this.privWebsocketClient = new WebSocket(_this.privUri);
                }
                else {
                    _this.privWebsocketClient = new ws(_this.privUri);
                }
                _this.privWebsocketClient.binaryType = "arraybuffer";
                _this.privReceivingMessageQueue = new Exports_1.Queue();
                _this.privDisconnectDeferral = new Exports_1.Deferred();
                _this.privSendMessageQueue = new Exports_1.Queue();
                _this.processSendQueue();
            }
            catch (error) {
                _this.privConnectionEstablishDeferral.resolve(new Exports_1.ConnectionOpenResponse(500, error));
                return _this.privConnectionEstablishDeferral.promise();
            }
            _this.onEvent(new Exports_1.ConnectionStartEvent(_this.privConnectionId, _this.privUri));
            _this.privWebsocketClient.onopen = function (e) {
                _this.privConnectionState = Exports_1.ConnectionState.Connected;
                _this.onEvent(new Exports_1.ConnectionEstablishedEvent(_this.privConnectionId));
                _this.privConnectionEstablishDeferral.resolve(new Exports_1.ConnectionOpenResponse(200, ""));
            };
            _this.privWebsocketClient.onerror = function (e) {
                // TODO: Understand what this is error is. Will we still get onClose ?
                if (_this.privConnectionState !== Exports_1.ConnectionState.Connecting) {
                    // TODO: Is this required ?
                    // this.onEvent(new ConnectionErrorEvent(errorMsg, connectionId));
                }
            };
            _this.privWebsocketClient.onclose = function (e) {
                if (_this.privConnectionState === Exports_1.ConnectionState.Connecting) {
                    _this.privConnectionState = Exports_1.ConnectionState.Disconnected;
                    // this.onEvent(new ConnectionEstablishErrorEvent(this.connectionId, e.code, e.reason));
                    _this.privConnectionEstablishDeferral.resolve(new Exports_1.ConnectionOpenResponse(e.code, e.reason));
                }
                else {
                    _this.onEvent(new Exports_1.ConnectionClosedEvent(_this.privConnectionId, e.code, e.reason));
                }
                _this.onClose(e.code, e.reason);
            };
            _this.privWebsocketClient.onmessage = function (e) {
                var networkReceivedTime = new Date().toISOString();
                if (_this.privConnectionState === Exports_1.ConnectionState.Connected) {
                    var deferred_1 = new Exports_1.Deferred();
                    // let id = ++this.idCounter;
                    _this.privReceivingMessageQueue.enqueueFromPromise(deferred_1.promise());
                    if (e.data instanceof ArrayBuffer) {
                        var rawMessage = new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Binary, e.data);
                        _this.privMessageFormatter
                            .toConnectionMessage(rawMessage)
                            .on(function (connectionMessage) {
                            _this.onEvent(new Exports_1.ConnectionMessageReceivedEvent(_this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred_1.resolve(connectionMessage);
                        }, function (error) {
                            // TODO: Events for these ?
                            deferred_1.reject("Invalid binary message format. Error: " + error);
                        });
                    }
                    else {
                        var rawMessage = new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Text, e.data);
                        _this.privMessageFormatter
                            .toConnectionMessage(rawMessage)
                            .on(function (connectionMessage) {
                            _this.onEvent(new Exports_1.ConnectionMessageReceivedEvent(_this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred_1.resolve(connectionMessage);
                        }, function (error) {
                            // TODO: Events for these ?
                            deferred_1.reject("Invalid text message format. Error: " + error);
                        });
                    }
                }
            };
            return _this.privConnectionEstablishDeferral.promise();
        };
        this.send = function (message) {
            if (_this.privConnectionState !== Exports_1.ConnectionState.Connected) {
                return Exports_1.PromiseHelper.fromError("Cannot send on connection that is in " + _this.privConnectionState + " state");
            }
            var messageSendStatusDeferral = new Exports_1.Deferred();
            var messageSendDeferral = new Exports_1.Deferred();
            _this.privSendMessageQueue.enqueueFromPromise(messageSendDeferral.promise());
            _this.privMessageFormatter
                .fromConnectionMessage(message)
                .on(function (rawMessage) {
                messageSendDeferral.resolve({
                    Message: message,
                    RawWebsocketMessage: rawMessage,
                    sendStatusDeferral: messageSendStatusDeferral,
                });
            }, function (error) {
                messageSendDeferral.reject("Error formatting the message. " + error);
            });
            return messageSendStatusDeferral.promise();
        };
        this.read = function () {
            if (_this.privConnectionState !== Exports_1.ConnectionState.Connected) {
                return Exports_1.PromiseHelper.fromError("Cannot read on connection that is in " + _this.privConnectionState + " state");
            }
            return _this.privReceivingMessageQueue.dequeue();
        };
        this.close = function (reason) {
            if (_this.privWebsocketClient) {
                if (_this.privConnectionState !== Exports_1.ConnectionState.Disconnected) {
                    _this.privWebsocketClient.close(1000, reason ? reason : "Normal closure by client");
                }
            }
            else {
                var deferral = new Exports_1.Deferred();
                deferral.resolve(true);
                return deferral.promise();
            }
            return _this.privDisconnectDeferral.promise();
        };
        this.sendRawMessage = function (sendItem) {
            try {
                // indicates we are draining the queue and it came with no message;
                if (!sendItem) {
                    return Exports_1.PromiseHelper.fromResult(true);
                }
                _this.onEvent(new Exports_1.ConnectionMessageSentEvent(_this.privConnectionId, new Date().toISOString(), sendItem.Message));
                _this.privWebsocketClient.send(sendItem.RawWebsocketMessage.payload);
                return Exports_1.PromiseHelper.fromResult(true);
            }
            catch (e) {
                return Exports_1.PromiseHelper.fromError("websocket send error: " + e);
            }
        };
        this.onClose = function (code, reason) {
            var closeReason = "Connection closed. " + code + ": " + reason;
            _this.privConnectionState = Exports_1.ConnectionState.Disconnected;
            _this.privDisconnectDeferral.resolve(true);
            _this.privReceivingMessageQueue.dispose(reason);
            _this.privReceivingMessageQueue.drainAndDispose(function (pendingReceiveItem) {
                // TODO: Events for these ?
                // Logger.instance.onEvent(new LoggingEvent(LogType.Warning, null, `Failed to process received message. Reason: ${closeReason}, Message: ${JSON.stringify(pendingReceiveItem)}`));
            }, closeReason);
            _this.privSendMessageQueue.drainAndDispose(function (pendingSendItem) {
                pendingSendItem.sendStatusDeferral.reject(closeReason);
            }, closeReason);
        };
        this.processSendQueue = function () {
            _this.privSendMessageQueue
                .dequeue()
                .on(function (sendItem) {
                // indicates we are draining the queue and it came with no message;
                if (!sendItem) {
                    return;
                }
                _this.sendRawMessage(sendItem)
                    .on(function (result) {
                    sendItem.sendStatusDeferral.resolve(result);
                    _this.processSendQueue();
                }, function (sendError) {
                    sendItem.sendStatusDeferral.reject(sendError);
                    _this.processSendQueue();
                });
            }, function (error) {
                // do nothing
            });
        };
        this.onEvent = function (event) {
            _this.privConnectionEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        if (!uri) {
            throw new Exports_1.ArgumentNullError("uri");
        }
        if (!messageFormatter) {
            throw new Exports_1.ArgumentNullError("messageFormatter");
        }
        this.privConnectionEvents = new Exports_1.EventSource();
        this.privConnectionId = connectionId;
        this.privMessageFormatter = messageFormatter;
        this.privConnectionState = Exports_1.ConnectionState.None;
        this.privUri = uri;
    }
    Object.defineProperty(WebsocketMessageAdapter.prototype, "state", {
        get: function () {
            return this.privConnectionState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebsocketMessageAdapter.prototype, "events", {
        get: function () {
            return this.privConnectionEvents;
        },
        enumerable: true,
        configurable: true
    });
    WebsocketMessageAdapter.forceNpmWebSocket = false;
    return WebsocketMessageAdapter;
}());
exports.WebsocketMessageAdapter = WebsocketMessageAdapter;



/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

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
var Guid_1 = __webpack_require__(5);
var Exports_1 = __webpack_require__(1);
var Exports_2 = __webpack_require__(0);
var AudioStreamFormat_1 = __webpack_require__(7);
var bufferSize = 4096;
/**
 * Represents audio input stream used for custom audio input configurations.
 * @class AudioInputStream
 */
var AudioInputStream = /** @class */ (function () {
    /**
     * Creates and initializes an instance.
     * @constructor
     */
    function AudioInputStream() {
    }
    /**
     * Creates a memory backed PushAudioInputStream with the specified audio format.
     * @member AudioInputStream.createPushStream
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     *        written to the push audio stream's write() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PushAudioInputStream} The audio input stream being created.
     */
    AudioInputStream.createPushStream = function (format) {
        return PushAudioInputStream.create(format);
    };
    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for read()
     * and close() methods.
     * @member AudioInputStream.createPullStream
     * @function
     * @public
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object, derived from
     *        PullAudioInputStreamCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be returned from
     *        the callback's read() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PullAudioInputStream} The audio input stream being created.
     */
    AudioInputStream.createPullStream = function (callback, format) {
        return PullAudioInputStream.create(callback, format);
        // throw new Error("Oops");
    };
    return AudioInputStream;
}());
exports.AudioInputStream = AudioInputStream;
/**
 * Represents memory backed push audio input stream used for custom audio input configurations.
 * @class PushAudioInputStream
 */
// tslint:disable-next-line:max-classes-per-file
var PushAudioInputStream = /** @class */ (function (_super) {
    __extends(PushAudioInputStream, _super);
    function PushAudioInputStream() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Creates a memory backed PushAudioInputStream with the specified audio format.
     * @member PushAudioInputStream.create
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be written to the
     *        push audio stream's write() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PushAudioInputStream} The push audio input stream being created.
     */
    PushAudioInputStream.create = function (format) {
        return new PushAudioInputStreamImpl(format);
    };
    return PushAudioInputStream;
}(AudioInputStream));
exports.PushAudioInputStream = PushAudioInputStream;
/**
 * Represents memory backed push audio input stream used for custom audio input configurations.
 * @private
 * @class PushAudioInputStreamImpl
 */
// tslint:disable-next-line:max-classes-per-file
var PushAudioInputStreamImpl = /** @class */ (function (_super) {
    __extends(PushAudioInputStreamImpl, _super);
    /**
     * Creates and initalizes an instance with the given values.
     * @constructor
     * @param {AudioStreamFormat} format - The audio stream format.
     */
    function PushAudioInputStreamImpl(format) {
        var _this = _super.call(this) || this;
        _this.privStream = new Exports_1.Stream();
        _this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        if (format === undefined) {
            _this.privFormat = AudioStreamFormat_1.AudioStreamFormatImpl.getDefaultInputFormat();
        }
        else {
            _this.privFormat = format;
        }
        _this.privEvents = new Exports_1.EventSource();
        _this.privId = Guid_1.createNoDashGuid();
        return _this;
    }
    Object.defineProperty(PushAudioInputStreamImpl.prototype, "format", {
        /**
         * Format information for the audio
         */
        get: function () {
            return this.privFormat;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Writes the audio data specified by making an internal copy of the data.
     * @member PushAudioInputStreamImpl.prototype.write
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - The audio buffer of which this function will make a copy.
     */
    PushAudioInputStreamImpl.prototype.write = function (dataBuffer) {
        // Break the data up into smaller chunks if needed.
        var i;
        for (i = bufferSize - 1; i < dataBuffer.byteLength; i += bufferSize) {
            this.privStream.write(dataBuffer.slice(i - (bufferSize - 1), i + 1));
        }
        if ((i - (bufferSize - 1)) !== dataBuffer.byteLength) {
            this.privStream.write(dataBuffer.slice(i - (bufferSize - 1), dataBuffer.byteLength));
        }
    };
    /**
     * Closes the stream.
     * @member PushAudioInputStreamImpl.prototype.close
     * @function
     * @public
     */
    PushAudioInputStreamImpl.prototype.close = function () {
        this.privStream.close();
    };
    PushAudioInputStreamImpl.prototype.id = function () {
        return this.privId;
    };
    PushAudioInputStreamImpl.prototype.turnOn = function () {
        this.onEvent(new Exports_1.AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new Exports_1.AudioSourceReadyEvent(this.privId));
        return Exports_1.PromiseHelper.fromResult(true);
    };
    PushAudioInputStreamImpl.prototype.attach = function (audioNodeId) {
        var _this = this;
        this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(this.privId, audioNodeId));
        return this.turnOn()
            .onSuccessContinueWith(function (_) {
            // For now we support a single parallel reader of the pushed stream.
            // So we can simiply hand the stream to the recognizer and let it recognize.
            return _this.privStream.getReader();
        })
            .onSuccessContinueWith(function (streamReader) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachedEvent(_this.privId, audioNodeId));
            return {
                detach: function () {
                    streamReader.close();
                    _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
                    _this.turnOff();
                },
                id: function () {
                    return audioNodeId;
                },
                read: function () {
                    return streamReader.read();
                },
            };
        });
    };
    PushAudioInputStreamImpl.prototype.detach = function (audioNodeId) {
        this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
    };
    PushAudioInputStreamImpl.prototype.turnOff = function () {
        return Exports_1.PromiseHelper.fromResult(false);
    };
    Object.defineProperty(PushAudioInputStreamImpl.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    return PushAudioInputStreamImpl;
}(PushAudioInputStream));
exports.PushAudioInputStreamImpl = PushAudioInputStreamImpl;
/*
 * Represents audio input stream used for custom audio input configurations.
 * @class PullAudioInputStream
 */
// tslint:disable-next-line:max-classes-per-file
var PullAudioInputStream = /** @class */ (function (_super) {
    __extends(PullAudioInputStream, _super);
    /**
     * Creates and initializes and instance.
     * @constructor
     */
    function PullAudioInputStream() {
        return _super.call(this) || this;
    }
    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for
     * read() and close() methods, using the default format (16 kHz 16bit mono PCM).
     * @member PullAudioInputStream.create
     * @function
     * @public
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object,
     *        derived from PullAudioInputStreamCustomCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     *        returned from the callback's read() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PullAudioInputStream} The push audio input stream being created.
     */
    PullAudioInputStream.create = function (callback, format) {
        return new PullAudioInputStreamImpl(callback, format);
    };
    return PullAudioInputStream;
}(AudioInputStream));
exports.PullAudioInputStream = PullAudioInputStream;
/**
 * Represents audio input stream used for custom audio input configurations.
 * @private
 * @class PullAudioInputStreamImpl
 */
// tslint:disable-next-line:max-classes-per-file
var PullAudioInputStreamImpl = /** @class */ (function (_super) {
    __extends(PullAudioInputStreamImpl, _super);
    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for
     * read() and close() methods, using the default format (16 kHz 16bit mono PCM).
     * @constructor
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object,
     *        derived from PullAudioInputStreamCustomCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     *        returned from the callback's read() method (currently only support 16 kHz 16bit mono PCM).
     */
    function PullAudioInputStreamImpl(callback, format) {
        var _this = _super.call(this) || this;
        _this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        if (undefined === format) {
            _this.privFormat = Exports_2.AudioStreamFormat.getDefaultInputFormat();
        }
        else {
            _this.privFormat = format;
        }
        _this.privEvents = new Exports_1.EventSource();
        _this.privId = Guid_1.createNoDashGuid();
        _this.privCallback = callback;
        _this.privIsClosed = false;
        return _this;
    }
    Object.defineProperty(PullAudioInputStreamImpl.prototype, "format", {
        /**
         * Format information for the audio
         */
        get: function () {
            return this.privFormat;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Closes the stream.
     * @member PullAudioInputStreamImpl.prototype.close
     * @function
     * @public
     */
    PullAudioInputStreamImpl.prototype.close = function () {
        this.privIsClosed = true;
        this.privCallback.close();
    };
    PullAudioInputStreamImpl.prototype.id = function () {
        return this.privId;
    };
    PullAudioInputStreamImpl.prototype.turnOn = function () {
        this.onEvent(new Exports_1.AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new Exports_1.AudioSourceReadyEvent(this.privId));
        return Exports_1.PromiseHelper.fromResult(true);
    };
    PullAudioInputStreamImpl.prototype.attach = function (audioNodeId) {
        var _this = this;
        this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(this.privId, audioNodeId));
        return this.turnOn()
            .onSuccessContinueWith(function (result) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachedEvent(_this.privId, audioNodeId));
            return {
                detach: function () {
                    _this.privCallback.close();
                    _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
                    _this.turnOff();
                },
                id: function () {
                    return audioNodeId;
                },
                read: function () {
                    var readBuff = new ArrayBuffer(bufferSize);
                    var pulledBytes = _this.privCallback.read(readBuff);
                    return Exports_1.PromiseHelper.fromResult({
                        buffer: readBuff.slice(0, pulledBytes),
                        isEnd: _this.privIsClosed,
                    });
                },
            };
        });
    };
    PullAudioInputStreamImpl.prototype.detach = function (audioNodeId) {
        this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
    };
    PullAudioInputStreamImpl.prototype.turnOff = function () {
        return Exports_1.PromiseHelper.fromResult(false);
    };
    Object.defineProperty(PullAudioInputStreamImpl.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    return PullAudioInputStreamImpl;
}(PullAudioInputStream));
exports.PullAudioInputStreamImpl = PullAudioInputStreamImpl;



/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(6);
var Exports_2 = __webpack_require__(2);
var Exports_3 = __webpack_require__(1);
var Exports_4 = __webpack_require__(0);
var Exports_5 = __webpack_require__(2);
var QueryParameterNames_1 = __webpack_require__(69);
var SpeechConnectionFactory = /** @class */ (function () {
    function SpeechConnectionFactory() {
        var _this = this;
        this.create = function (config, authInfo, connectionId) {
            var endpoint = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_Endpoint, undefined);
            var queryParams = {};
            var endpointId = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_EndpointId, undefined);
            var language = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_RecoLanguage, undefined);
            if (endpointId) {
                if (!endpoint || endpoint.search(QueryParameterNames_1.QueryParameterNames.DeploymentIdParamName) === -1) {
                    queryParams[QueryParameterNames_1.QueryParameterNames.DeploymentIdParamName] = endpointId;
                }
            }
            else if (language) {
                if (!endpoint || endpoint.search(QueryParameterNames_1.QueryParameterNames.LanguageParamName) === -1) {
                    queryParams[QueryParameterNames_1.QueryParameterNames.LanguageParamName] = language;
                }
            }
            if (!endpoint || endpoint.search(QueryParameterNames_1.QueryParameterNames.FormatParamName) === -1) {
                queryParams[QueryParameterNames_1.QueryParameterNames.FormatParamName] = config.parameters.getProperty(Exports_2.OutputFormatPropertyName, Exports_4.OutputFormat[Exports_4.OutputFormat.Simple]).toLowerCase();
            }
            if (_this.isDebugModeEnabled) {
                queryParams[QueryParameterNames_1.QueryParameterNames.TestHooksParamName] = "1";
            }
            if (!endpoint) {
                var region = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_Region, undefined);
                switch (config.recognitionMode) {
                    case Exports_5.RecognitionMode.Conversation:
                        endpoint = _this.host(region) + _this.conversationRelativeUri;
                        break;
                    case Exports_5.RecognitionMode.Dictation:
                        endpoint = _this.host(region) + _this.dictationRelativeUri;
                        break;
                    default:
                        endpoint = _this.host(region) + _this.interactiveRelativeUri; // default is interactive
                        break;
                }
            }
            var headers = {};
            headers[authInfo.headerName] = authInfo.token;
            headers[QueryParameterNames_1.QueryParameterNames.ConnectionIdHeader] = connectionId;
            return new Exports_1.WebsocketConnection(endpoint, queryParams, headers, new Exports_5.WebsocketMessageFormatter(), connectionId);
        };
    }
    SpeechConnectionFactory.prototype.host = function (region) {
        return Exports_3.Storage.local.getOrAdd("Host", "wss://" + region + ".stt.speech.microsoft.com");
    };
    Object.defineProperty(SpeechConnectionFactory.prototype, "interactiveRelativeUri", {
        get: function () {
            return Exports_3.Storage.local.getOrAdd("InteractiveRelativeUri", "/speech/recognition/interactive/cognitiveservices/v1");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionFactory.prototype, "conversationRelativeUri", {
        get: function () {
            return Exports_3.Storage.local.getOrAdd("ConversationRelativeUri", "/speech/recognition/conversation/cognitiveservices/v1");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionFactory.prototype, "dictationRelativeUri", {
        get: function () {
            return Exports_3.Storage.local.getOrAdd("DictationRelativeUri", "/speech/recognition/dictation/cognitiveservices/v1");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionFactory.prototype, "isDebugModeEnabled", {
        get: function () {
            var value = Exports_3.Storage.local.getOrAdd("IsDebugModeEnabled", "false");
            return value.toLowerCase() === "true";
        },
        enumerable: true,
        configurable: true
    });
    return SpeechConnectionFactory;
}());
exports.SpeechConnectionFactory = SpeechConnectionFactory;



/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

window.SpeechSDK = __webpack_require__(22);



/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var Exports_1 = __webpack_require__(6);
var Exports_2 = __webpack_require__(1);
// Common.Storage.SetLocalStorage(new Common.Browser.LocalStorage());
// Common.Storage.SetSessionStorage(new Common.Browser.SessionStorage());
Exports_2.Events.instance.attachListener(new Exports_1.ConsoleLoggingListener());
// Speech SDK API
__export(__webpack_require__(0));



/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var ConsoleLoggingListener = /** @class */ (function () {
    function ConsoleLoggingListener(logLevelFilter) {
        if (logLevelFilter === void 0) { logLevelFilter = Exports_1.EventType.Warning; }
        var _this = this;
        this.onEvent = function (event) {
            if (event.eventType >= _this.privLogLevelFilter) {
                var log = _this.toString(event);
                switch (event.eventType) {
                    case Exports_1.EventType.Debug:
                        // tslint:disable-next-line:no-console
                        console.debug(log);
                        break;
                    case Exports_1.EventType.Info:
                        // tslint:disable-next-line:no-console
                        console.info(log);
                        break;
                    case Exports_1.EventType.Warning:
                        // tslint:disable-next-line:no-console
                        console.warn(log);
                        break;
                    case Exports_1.EventType.Error:
                        // tslint:disable-next-line:no-console
                        console.error(log);
                        break;
                    default:
                        // tslint:disable-next-line:no-console
                        console.log(log);
                        break;
                }
            }
        };
        this.toString = function (event) {
            var logFragments = [
                "" + event.EventTime,
                "" + event.Name,
            ];
            for (var prop in event) {
                if (prop && event.hasOwnProperty(prop) &&
                    prop !== "eventTime" && prop !== "eventType" &&
                    prop !== "eventId" && prop !== "name" &&
                    prop !== "constructor") {
                    var value = event[prop];
                    var valueToLog = "<NULL>";
                    if (value !== undefined && value !== null) {
                        if (typeof (value) === "number" || typeof (value) === "string") {
                            valueToLog = value.toString();
                        }
                        else {
                            valueToLog = JSON.stringify(value);
                        }
                    }
                    logFragments.push(prop + ": " + valueToLog);
                }
            }
            return logFragments.join(" | ");
        };
        this.privLogLevelFilter = logLevelFilter;
    }
    return ConsoleLoggingListener;
}());
exports.ConsoleLoggingListener = ConsoleLoggingListener;



/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

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
var PlatformEvent_1 = __webpack_require__(8);
var AudioSourceEvent = /** @class */ (function (_super) {
    __extends(AudioSourceEvent, _super);
    function AudioSourceEvent(eventName, audioSourceId, eventType) {
        if (eventType === void 0) { eventType = PlatformEvent_1.EventType.Info; }
        var _this = _super.call(this, eventName, eventType) || this;
        _this.privAudioSourceId = audioSourceId;
        return _this;
    }
    Object.defineProperty(AudioSourceEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    return AudioSourceEvent;
}(PlatformEvent_1.PlatformEvent));
exports.AudioSourceEvent = AudioSourceEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioSourceInitializingEvent = /** @class */ (function (_super) {
    __extends(AudioSourceInitializingEvent, _super);
    function AudioSourceInitializingEvent(audioSourceId) {
        return _super.call(this, "AudioSourceInitializingEvent", audioSourceId) || this;
    }
    return AudioSourceInitializingEvent;
}(AudioSourceEvent));
exports.AudioSourceInitializingEvent = AudioSourceInitializingEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioSourceReadyEvent = /** @class */ (function (_super) {
    __extends(AudioSourceReadyEvent, _super);
    function AudioSourceReadyEvent(audioSourceId) {
        return _super.call(this, "AudioSourceReadyEvent", audioSourceId) || this;
    }
    return AudioSourceReadyEvent;
}(AudioSourceEvent));
exports.AudioSourceReadyEvent = AudioSourceReadyEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioSourceOffEvent = /** @class */ (function (_super) {
    __extends(AudioSourceOffEvent, _super);
    function AudioSourceOffEvent(audioSourceId) {
        return _super.call(this, "AudioSourceOffEvent", audioSourceId) || this;
    }
    return AudioSourceOffEvent;
}(AudioSourceEvent));
exports.AudioSourceOffEvent = AudioSourceOffEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioSourceErrorEvent = /** @class */ (function (_super) {
    __extends(AudioSourceErrorEvent, _super);
    function AudioSourceErrorEvent(audioSourceId, error) {
        var _this = _super.call(this, "AudioSourceErrorEvent", audioSourceId, PlatformEvent_1.EventType.Error) || this;
        _this.privError = error;
        return _this;
    }
    Object.defineProperty(AudioSourceErrorEvent.prototype, "error", {
        get: function () {
            return this.privError;
        },
        enumerable: true,
        configurable: true
    });
    return AudioSourceErrorEvent;
}(AudioSourceEvent));
exports.AudioSourceErrorEvent = AudioSourceErrorEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioStreamNodeEvent = /** @class */ (function (_super) {
    __extends(AudioStreamNodeEvent, _super);
    function AudioStreamNodeEvent(eventName, audioSourceId, audioNodeId) {
        var _this = _super.call(this, eventName, audioSourceId) || this;
        _this.privAudioNodeId = audioNodeId;
        return _this;
    }
    Object.defineProperty(AudioStreamNodeEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    return AudioStreamNodeEvent;
}(AudioSourceEvent));
exports.AudioStreamNodeEvent = AudioStreamNodeEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioStreamNodeAttachingEvent = /** @class */ (function (_super) {
    __extends(AudioStreamNodeAttachingEvent, _super);
    function AudioStreamNodeAttachingEvent(audioSourceId, audioNodeId) {
        return _super.call(this, "AudioStreamNodeAttachingEvent", audioSourceId, audioNodeId) || this;
    }
    return AudioStreamNodeAttachingEvent;
}(AudioStreamNodeEvent));
exports.AudioStreamNodeAttachingEvent = AudioStreamNodeAttachingEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioStreamNodeAttachedEvent = /** @class */ (function (_super) {
    __extends(AudioStreamNodeAttachedEvent, _super);
    function AudioStreamNodeAttachedEvent(audioSourceId, audioNodeId) {
        return _super.call(this, "AudioStreamNodeAttachedEvent", audioSourceId, audioNodeId) || this;
    }
    return AudioStreamNodeAttachedEvent;
}(AudioStreamNodeEvent));
exports.AudioStreamNodeAttachedEvent = AudioStreamNodeAttachedEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioStreamNodeDetachedEvent = /** @class */ (function (_super) {
    __extends(AudioStreamNodeDetachedEvent, _super);
    function AudioStreamNodeDetachedEvent(audioSourceId, audioNodeId) {
        return _super.call(this, "AudioStreamNodeDetachedEvent", audioSourceId, audioNodeId) || this;
    }
    return AudioStreamNodeDetachedEvent;
}(AudioStreamNodeEvent));
exports.AudioStreamNodeDetachedEvent = AudioStreamNodeDetachedEvent;
// tslint:disable-next-line:max-classes-per-file
var AudioStreamNodeErrorEvent = /** @class */ (function (_super) {
    __extends(AudioStreamNodeErrorEvent, _super);
    function AudioStreamNodeErrorEvent(audioSourceId, audioNodeId, error) {
        var _this = _super.call(this, "AudioStreamNodeErrorEvent", audioSourceId, audioNodeId) || this;
        _this.privError = error;
        return _this;
    }
    Object.defineProperty(AudioStreamNodeErrorEvent.prototype, "error", {
        get: function () {
            return this.privError;
        },
        enumerable: true,
        configurable: true
    });
    return AudioStreamNodeErrorEvent;
}(AudioStreamNodeEvent));
exports.AudioStreamNodeErrorEvent = AudioStreamNodeErrorEvent;



/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

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
var PlatformEvent_1 = __webpack_require__(8);
var ConnectionEvent = /** @class */ (function (_super) {
    __extends(ConnectionEvent, _super);
    function ConnectionEvent(eventName, connectionId, eventType) {
        if (eventType === void 0) { eventType = PlatformEvent_1.EventType.Info; }
        var _this = _super.call(this, eventName, eventType) || this;
        _this.privConnectionId = connectionId;
        return _this;
    }
    Object.defineProperty(ConnectionEvent.prototype, "connectionId", {
        get: function () {
            return this.privConnectionId;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionEvent;
}(PlatformEvent_1.PlatformEvent));
exports.ConnectionEvent = ConnectionEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionStartEvent = /** @class */ (function (_super) {
    __extends(ConnectionStartEvent, _super);
    function ConnectionStartEvent(connectionId, uri, headers) {
        var _this = _super.call(this, "ConnectionStartEvent", connectionId) || this;
        _this.privUri = uri;
        _this.privHeaders = headers;
        return _this;
    }
    Object.defineProperty(ConnectionStartEvent.prototype, "uri", {
        get: function () {
            return this.privUri;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionStartEvent.prototype, "headers", {
        get: function () {
            return this.privHeaders;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionStartEvent;
}(ConnectionEvent));
exports.ConnectionStartEvent = ConnectionStartEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionEstablishedEvent = /** @class */ (function (_super) {
    __extends(ConnectionEstablishedEvent, _super);
    function ConnectionEstablishedEvent(connectionId, metadata) {
        return _super.call(this, "ConnectionEstablishedEvent", connectionId) || this;
    }
    return ConnectionEstablishedEvent;
}(ConnectionEvent));
exports.ConnectionEstablishedEvent = ConnectionEstablishedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionClosedEvent = /** @class */ (function (_super) {
    __extends(ConnectionClosedEvent, _super);
    function ConnectionClosedEvent(connectionId, statusCode, reason) {
        var _this = _super.call(this, "ConnectionClosedEvent", connectionId, PlatformEvent_1.EventType.Debug) || this;
        _this.privRreason = reason;
        _this.privStatusCode = statusCode;
        return _this;
    }
    Object.defineProperty(ConnectionClosedEvent.prototype, "reason", {
        get: function () {
            return this.privRreason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionClosedEvent.prototype, "statusCode", {
        get: function () {
            return this.privStatusCode;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionClosedEvent;
}(ConnectionEvent));
exports.ConnectionClosedEvent = ConnectionClosedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionEstablishErrorEvent = /** @class */ (function (_super) {
    __extends(ConnectionEstablishErrorEvent, _super);
    function ConnectionEstablishErrorEvent(connectionId, statuscode, reason) {
        var _this = _super.call(this, "ConnectionEstablishErrorEvent", connectionId, PlatformEvent_1.EventType.Error) || this;
        _this.privStatusCode = statuscode;
        _this.privReason = reason;
        return _this;
    }
    Object.defineProperty(ConnectionEstablishErrorEvent.prototype, "reason", {
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionEstablishErrorEvent.prototype, "statusCode", {
        get: function () {
            return this.privStatusCode;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionEstablishErrorEvent;
}(ConnectionEvent));
exports.ConnectionEstablishErrorEvent = ConnectionEstablishErrorEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionMessageReceivedEvent = /** @class */ (function (_super) {
    __extends(ConnectionMessageReceivedEvent, _super);
    function ConnectionMessageReceivedEvent(connectionId, networkReceivedTimeISO, message) {
        var _this = _super.call(this, "ConnectionMessageReceivedEvent", connectionId) || this;
        _this.privNetworkReceivedTime = networkReceivedTimeISO;
        _this.privMessage = message;
        return _this;
    }
    Object.defineProperty(ConnectionMessageReceivedEvent.prototype, "networkReceivedTime", {
        get: function () {
            return this.privNetworkReceivedTime;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessageReceivedEvent.prototype, "message", {
        get: function () {
            return this.privMessage;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionMessageReceivedEvent;
}(ConnectionEvent));
exports.ConnectionMessageReceivedEvent = ConnectionMessageReceivedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionMessageSentEvent = /** @class */ (function (_super) {
    __extends(ConnectionMessageSentEvent, _super);
    function ConnectionMessageSentEvent(connectionId, networkSentTimeISO, message) {
        var _this = _super.call(this, "ConnectionMessageSentEvent", connectionId) || this;
        _this.privNetworkSentTime = networkSentTimeISO;
        _this.privMessage = message;
        return _this;
    }
    Object.defineProperty(ConnectionMessageSentEvent.prototype, "networkSentTime", {
        get: function () {
            return this.privNetworkSentTime;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessageSentEvent.prototype, "message", {
        get: function () {
            return this.privMessage;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionMessageSentEvent;
}(ConnectionEvent));
exports.ConnectionMessageSentEvent = ConnectionMessageSentEvent;



/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var ConnectionOpenResponse = /** @class */ (function () {
    function ConnectionOpenResponse(statusCode, reason) {
        this.privStatusCode = statusCode;
        this.privReason = reason;
    }
    Object.defineProperty(ConnectionOpenResponse.prototype, "statusCode", {
        get: function () {
            return this.privStatusCode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionOpenResponse.prototype, "reason", {
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionOpenResponse;
}());
exports.ConnectionOpenResponse = ConnectionOpenResponse;



/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var EventSource_1 = __webpack_require__(13);
var Events = /** @class */ (function () {
    function Events() {
    }
    Object.defineProperty(Events, "instance", {
        get: function () {
            return Events.privInstance;
        },
        enumerable: true,
        configurable: true
    });
    Events.privInstance = new EventSource_1.EventSource();
    Events.setEventSource = function (eventSource) {
        if (!eventSource) {
            throw new Error_1.ArgumentNullError("eventSource");
        }
        Events.privInstance = eventSource;
    };
    return Events;
}());
exports.Events = Events;



/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["None"] = 0] = "None";
    ConnectionState[ConnectionState["Connected"] = 1] = "Connected";
    ConnectionState[ConnectionState["Connecting"] = 2] = "Connecting";
    ConnectionState[ConnectionState["Disconnected"] = 3] = "Disconnected";
})(ConnectionState = exports.ConnectionState || (exports.ConnectionState = {}));



/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var ConnectionMessage_1 = __webpack_require__(12);
var Error_1 = __webpack_require__(3);
var Guid_1 = __webpack_require__(5);
var RawWebsocketMessage = /** @class */ (function () {
    function RawWebsocketMessage(messageType, payload, id) {
        this.privPayload = null;
        if (!payload) {
            throw new Error_1.ArgumentNullError("payload");
        }
        if (messageType === ConnectionMessage_1.MessageType.Binary && !(payload instanceof ArrayBuffer)) {
            throw new Error_1.InvalidOperationError("Payload must be ArrayBuffer");
        }
        if (messageType === ConnectionMessage_1.MessageType.Text && !(typeof (payload) === "string")) {
            throw new Error_1.InvalidOperationError("Payload must be a string");
        }
        this.privMessageType = messageType;
        this.privPayload = payload;
        this.privId = id ? id : Guid_1.createNoDashGuid();
    }
    Object.defineProperty(RawWebsocketMessage.prototype, "messageType", {
        get: function () {
            return this.privMessageType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "payload", {
        get: function () {
            return this.privPayload;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "textContent", {
        get: function () {
            if (this.privMessageType === ConnectionMessage_1.MessageType.Binary) {
                throw new Error_1.InvalidOperationError("Not supported for binary message");
            }
            return this.privPayload;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "binaryContent", {
        get: function () {
            if (this.privMessageType === ConnectionMessage_1.MessageType.Text) {
                throw new Error_1.InvalidOperationError("Not supported for text message");
            }
            return this.privPayload;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    return RawWebsocketMessage;
}());
exports.RawWebsocketMessage = RawWebsocketMessage;



/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var RiffPcmEncoder = /** @class */ (function () {
    function RiffPcmEncoder(actualSampleRate, desiredSampleRate) {
        var _this = this;
        this.privChannelCount = 1;
        this.encode = function (needHeader, actualAudioFrame) {
            var audioFrame = _this.downSampleAudioFrame(actualAudioFrame, _this.privActualSampleRate, _this.privDesiredSampleRate);
            if (!audioFrame) {
                return null;
            }
            var audioLength = audioFrame.length * 2;
            if (!needHeader) {
                var buffer_1 = new ArrayBuffer(audioLength);
                var view_1 = new DataView(buffer_1);
                _this.floatTo16BitPCM(view_1, 0, audioFrame);
                return buffer_1;
            }
            var buffer = new ArrayBuffer(44 + audioLength);
            var bitsPerSample = 16;
            var bytesPerSample = bitsPerSample / 8;
            // We dont know ahead of time about the length of audio to stream. So set to 0.
            var fileLength = 0;
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
            var view = new DataView(buffer);
            /* RIFF identifier */
            _this.setString(view, 0, "RIFF");
            /* file length */
            view.setUint32(4, fileLength, true);
            /* RIFF type & Format */
            _this.setString(view, 8, "WAVEfmt ");
            /* format chunk length */
            view.setUint32(16, 16, true);
            /* sample format (raw) */
            view.setUint16(20, 1, true);
            /* channel count */
            view.setUint16(22, _this.privChannelCount, true);
            /* sample rate */
            view.setUint32(24, _this.privDesiredSampleRate, true);
            /* byte rate (sample rate * block align) */
            view.setUint32(28, _this.privDesiredSampleRate * _this.privChannelCount * bytesPerSample, true);
            /* block align (channel count * bytes per sample) */
            view.setUint16(32, _this.privChannelCount * bytesPerSample, true);
            /* bits per sample */
            view.setUint16(34, bitsPerSample, true);
            /* data chunk identifier */
            _this.setString(view, 36, "data");
            /* data chunk length */
            view.setUint32(40, fileLength, true);
            _this.floatTo16BitPCM(view, 44, audioFrame);
            return buffer;
        };
        this.setString = function (view, offset, str) {
            for (var i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };
        this.floatTo16BitPCM = function (view, offset, input) {
            for (var i = 0; i < input.length; i++, offset += 2) {
                var s = Math.max(-1, Math.min(1, input[i]));
                view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        };
        this.downSampleAudioFrame = function (srcFrame, srcRate, dstRate) {
            if (dstRate === srcRate || dstRate > srcRate) {
                return srcFrame;
            }
            var ratio = srcRate / dstRate;
            var dstLength = Math.round(srcFrame.length / ratio);
            var dstFrame = new Float32Array(dstLength);
            var srcOffset = 0;
            var dstOffset = 0;
            while (dstOffset < dstLength) {
                var nextSrcOffset = Math.round((dstOffset + 1) * ratio);
                var accum = 0;
                var count = 0;
                while (srcOffset < nextSrcOffset && srcOffset < srcFrame.length) {
                    accum += srcFrame[srcOffset++];
                    count++;
                }
                dstFrame[dstOffset++] = accum / count;
            }
            return dstFrame;
        };
        this.privActualSampleRate = actualSampleRate;
        this.privDesiredSampleRate = desiredSampleRate;
    }
    return RiffPcmEncoder;
}());
exports.RiffPcmEncoder = RiffPcmEncoder;



/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var InMemoryStorage_1 = __webpack_require__(14);
var Storage = /** @class */ (function () {
    function Storage() {
    }
    Object.defineProperty(Storage, "session", {
        get: function () {
            return Storage.privSessionStorage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Storage, "local", {
        get: function () {
            return Storage.privLocalStorage;
        },
        enumerable: true,
        configurable: true
    });
    Storage.privSessionStorage = new InMemoryStorage_1.InMemoryStorage();
    Storage.privLocalStorage = new InMemoryStorage_1.InMemoryStorage();
    Storage.setSessionStorage = function (sessionStorage) {
        if (!sessionStorage) {
            throw new Error_1.ArgumentNullError("sessionStorage");
        }
        Storage.privSessionStorage = sessionStorage;
    };
    Storage.setLocalStorage = function (localStorage) {
        if (!localStorage) {
            throw new Error_1.ArgumentNullError("localStorage");
        }
        Storage.privLocalStorage = localStorage;
    };
    return Storage;
}());
exports.Storage = Storage;



/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = __webpack_require__(3);
var Guid_1 = __webpack_require__(5);
var Queue_1 = __webpack_require__(17);
var Stream = /** @class */ (function () {
    function Stream(streamId) {
        var _this = this;
        this.privReaderIdCounter = 1;
        this.privIsEnded = false;
        this.write = function (buffer2) {
            _this.throwIfClosed();
            _this.writeStreamChunk({
                buffer: buffer2,
                isEnd: false,
            });
        };
        this.getReader = function () {
            var readerId = _this.privReaderIdCounter;
            _this.privReaderIdCounter++;
            var readerQueue = new Queue_1.Queue();
            var currentLength = _this.privStreambuffer.length;
            _this.privReaderQueues[readerId] = readerQueue;
            for (var i = 0; i < currentLength; i++) {
                readerQueue.enqueue(_this.privStreambuffer[i]);
            }
            return new StreamReader(_this.privId, readerQueue, function () {
                delete _this.privReaderQueues[readerId];
            });
        };
        this.close = function () {
            if (!_this.privIsEnded) {
                _this.writeStreamChunk({
                    buffer: null,
                    isEnd: true,
                });
                _this.privIsEnded = true;
            }
        };
        this.writeStreamChunk = function (streamChunk) {
            _this.throwIfClosed();
            _this.privStreambuffer.push(streamChunk);
            for (var readerId in _this.privReaderQueues) {
                if (!_this.privReaderQueues[readerId].isDisposed()) {
                    try {
                        _this.privReaderQueues[readerId].enqueue(streamChunk);
                    }
                    catch (e) {
                        // Do nothing
                    }
                }
            }
        };
        this.throwIfClosed = function () {
            if (_this.privIsEnded) {
                throw new Error_1.InvalidOperationError("Stream closed");
            }
        };
        this.privId = streamId ? streamId : Guid_1.createNoDashGuid();
        this.privStreambuffer = [];
        this.privReaderQueues = {};
    }
    Object.defineProperty(Stream.prototype, "isClosed", {
        get: function () {
            return this.privIsEnded;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    return Stream;
}());
exports.Stream = Stream;
// tslint:disable-next-line:max-classes-per-file
var StreamReader = /** @class */ (function () {
    function StreamReader(streamId, readerQueue, onClose) {
        var _this = this;
        this.privIsClosed = false;
        this.read = function () {
            if (_this.isClosed) {
                throw new Error_1.InvalidOperationError("StreamReader closed");
            }
            return _this.privReaderQueue
                .dequeue()
                .onSuccessContinueWith(function (streamChunk) {
                if (streamChunk.isEnd) {
                    _this.privReaderQueue.dispose("End of stream reached");
                }
                return streamChunk;
            });
        };
        this.close = function () {
            if (!_this.privIsClosed) {
                _this.privIsClosed = true;
                _this.privReaderQueue.dispose("StreamReader closed");
                _this.privOnClose();
            }
        };
        this.privReaderQueue = readerQueue;
        this.privOnClose = onClose;
        this.privStreamId = streamId;
    }
    Object.defineProperty(StreamReader.prototype, "isClosed", {
        get: function () {
            return this.privIsClosed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamReader.prototype, "streamId", {
        get: function () {
            return this.privStreamId;
        },
        enumerable: true,
        configurable: true
    });
    return StreamReader;
}());
exports.StreamReader = StreamReader;



/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var LocalStorage = /** @class */ (function () {
    function LocalStorage() {
        this.get = function (key) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            return localStorage.getItem(key);
        };
        this.getOrAdd = function (key, valueToAdd) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            var value = localStorage.getItem(key);
            if (value === null || value === undefined) {
                localStorage.setItem(key, valueToAdd);
            }
            return localStorage.getItem(key);
        };
        this.set = function (key, value) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            localStorage.setItem(key, value);
        };
        this.remove = function (key) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            localStorage.removeItem(key);
        };
    }
    return LocalStorage;
}());
exports.LocalStorage = LocalStorage;



/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var AudioStreamFormat_1 = __webpack_require__(7);
var Exports_1 = __webpack_require__(1);
var MicAudioSource = /** @class */ (function () {
    function MicAudioSource(privRecorder, constraints, audioSourceId) {
        var _this = this;
        this.privRecorder = privRecorder;
        this.privStreams = {};
        this.turnOn = function () {
            if (_this.privInitializeDeferral) {
                return _this.privInitializeDeferral.promise();
            }
            _this.privInitializeDeferral = new Exports_1.Deferred();
            _this.createAudioContext();
            var nav = window.navigator;
            var getUserMedia = (nav.getUserMedia ||
                nav.webkitGetUserMedia ||
                nav.mozGetUserMedia ||
                nav.msGetUserMedia);
            if (!!nav.mediaDevices) {
                getUserMedia = function (constraints, successCallback, errorCallback) {
                    nav.mediaDevices
                        .getUserMedia(constraints)
                        .then(successCallback)
                        .catch(errorCallback);
                };
            }
            if (!getUserMedia) {
                var errorMsg = "Browser does not support getUserMedia.";
                _this.privInitializeDeferral.reject(errorMsg);
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, "")); // mic initialized error - no streamid at this point
            }
            else {
                var next = function () {
                    _this.onEvent(new Exports_1.AudioSourceInitializingEvent(_this.privId)); // no stream id
                    getUserMedia(_this.privConstraints, function (mediaStream) {
                        _this.privMediaStream = mediaStream;
                        _this.onEvent(new Exports_1.AudioSourceReadyEvent(_this.privId));
                        _this.privInitializeDeferral.resolve(true);
                    }, function (error) {
                        var errorMsg = "Error occurred during microphone initialization: " + error;
                        var tmp = _this.privInitializeDeferral;
                        // HACK: this should be handled through onError callbacks of all promises up the stack.
                        // Unfortunately, the current implementation does not provide an easy way to reject promises
                        // without a lot of code replication.
                        // TODO: fix promise implementation, allow for a graceful reject chaining.
                        _this.privInitializeDeferral = null;
                        tmp.reject(errorMsg); // this will bubble up through the whole chain of promises,
                        // with each new level adding extra "Unhandled callback error" prefix to the error message.
                        // The following line is not guaranteed to be executed.
                        _this.onEvent(new Exports_1.AudioSourceErrorEvent(_this.privId, errorMsg));
                    });
                };
                if (_this.privContext.state === "suspended") {
                    // NOTE: On iOS, the Web Audio API requires sounds to be triggered from an explicit user action.
                    // https://github.com/WebAudio/web-audio-api/issues/790
                    _this.privContext.resume().then(next, function (reason) {
                        _this.privInitializeDeferral.reject("Failed to initialize audio context: " + reason);
                    });
                }
                else {
                    next();
                }
            }
            return _this.privInitializeDeferral.promise();
        };
        this.id = function () {
            return _this.privId;
        };
        this.attach = function (audioNodeId) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(_this.privId, audioNodeId));
            return _this.listen(audioNodeId).onSuccessContinueWith(function (streamReader) {
                _this.onEvent(new Exports_1.AudioStreamNodeAttachedEvent(_this.privId, audioNodeId));
                return {
                    detach: function () {
                        streamReader.close();
                        delete _this.privStreams[audioNodeId];
                        _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
                        _this.turnOff();
                    },
                    id: function () {
                        return audioNodeId;
                    },
                    read: function () {
                        return streamReader.read();
                    },
                };
            });
        };
        this.detach = function (audioNodeId) {
            if (audioNodeId && _this.privStreams[audioNodeId]) {
                _this.privStreams[audioNodeId].close();
                delete _this.privStreams[audioNodeId];
                _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
            }
        };
        this.turnOff = function () {
            for (var streamId in _this.privStreams) {
                if (streamId) {
                    var stream = _this.privStreams[streamId];
                    if (stream) {
                        stream.close();
                    }
                }
            }
            _this.onEvent(new Exports_1.AudioSourceOffEvent(_this.privId)); // no stream now
            _this.privInitializeDeferral = null;
            _this.destroyAudioContext();
            return Exports_1.PromiseHelper.fromResult(true);
        };
        this.listen = function (audioNodeId) {
            return _this.turnOn()
                .onSuccessContinueWith(function (_) {
                var stream = new Exports_1.Stream(audioNodeId);
                _this.privStreams[audioNodeId] = stream;
                try {
                    _this.privRecorder.record(_this.privContext, _this.privMediaStream, stream);
                }
                catch (error) {
                    _this.onEvent(new Exports_1.AudioStreamNodeErrorEvent(_this.privId, audioNodeId, error));
                    throw error;
                }
                return stream.getReader();
            });
        };
        this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        this.createAudioContext = function () {
            if (!!_this.privContext) {
                return;
            }
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
            var AudioContext = (window.AudioContext)
                || (window.webkitAudioContext)
                || false;
            if (!AudioContext) {
                throw new Error("Browser does not support Web Audio API (AudioContext is not available).");
            }
            _this.privContext = new AudioContext();
        };
        this.destroyAudioContext = function () {
            if (!_this.privContext) {
                return;
            }
            _this.privRecorder.releaseMediaResources(_this.privContext);
            // This pattern brought to you by a bug in the TypeScript compiler where it
            // confuses the ("close" in this.privContext) with this.privContext always being null as the alternate.
            // https://github.com/Microsoft/TypeScript/issues/11498
            var hasClose = false;
            if ("close" in _this.privContext) {
                hasClose = true;
            }
            if (hasClose) {
                _this.privContext.close();
                _this.privContext = null;
            }
            else if (null !== _this.privContext && _this.privContext.state === "running") {
                // Suspend actually takes a callback, but analogous to the
                // resume method, it'll be only fired if suspend is called
                // in a direct response to a user action. The later is not always
                // the case, as TurnOff is also called, when we receive an
                // end-of-speech message from the service. So, doing a best effort
                // fire-and-forget here.
                _this.privContext.suspend();
            }
        };
        this.privId = audioSourceId ? audioSourceId : Exports_1.createNoDashGuid();
        this.privEvents = new Exports_1.EventSource();
        this.privConstraints = constraints || { audio: true, video: false };
    }
    Object.defineProperty(MicAudioSource.prototype, "format", {
        get: function () {
            return MicAudioSource.AUDIOFORMAT;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MicAudioSource.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    MicAudioSource.AUDIOFORMAT = AudioStreamFormat_1.AudioStreamFormat.getDefaultInputFormat();
    return MicAudioSource;
}());
exports.MicAudioSource = MicAudioSource;



/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var AudioStreamFormat_1 = __webpack_require__(7);
var Exports_1 = __webpack_require__(1);
var FileAudioSource = /** @class */ (function () {
    function FileAudioSource(file, audioSourceId) {
        var _this = this;
        this.privStreams = {};
        this.turnOn = function () {
            if (typeof FileReader === "undefined") {
                var errorMsg = "Browser does not support FileReader.";
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, "")); // initialization error - no streamid at this point
                return Exports_1.PromiseHelper.fromError(errorMsg);
            }
            else if (_this.privFile.name.lastIndexOf(".wav") !== _this.privFile.name.length - 4) {
                var errorMsg = _this.privFile.name + " is not supported. Only WAVE files are allowed at the moment.";
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, ""));
                return Exports_1.PromiseHelper.fromError(errorMsg);
            }
            else if (_this.privFile.size > FileAudioSource.MAX_SIZE) {
                var errorMsg = _this.privFile.name + " exceeds the maximum allowed file size (" + FileAudioSource.MAX_SIZE + ").";
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, ""));
                return Exports_1.PromiseHelper.fromError(errorMsg);
            }
            _this.onEvent(new Exports_1.AudioSourceInitializingEvent(_this.privId)); // no stream id
            _this.onEvent(new Exports_1.AudioSourceReadyEvent(_this.privId));
            return Exports_1.PromiseHelper.fromResult(true);
        };
        this.id = function () {
            return _this.privId;
        };
        this.attach = function (audioNodeId) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(_this.privId, audioNodeId));
            return _this.upload(audioNodeId).onSuccessContinueWith(function (streamReader) {
                _this.onEvent(new Exports_1.AudioStreamNodeAttachedEvent(_this.privId, audioNodeId));
                return {
                    detach: function () {
                        streamReader.close();
                        delete _this.privStreams[audioNodeId];
                        _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
                        _this.turnOff();
                    },
                    id: function () {
                        return audioNodeId;
                    },
                    read: function () {
                        return streamReader.read();
                    },
                };
            });
        };
        this.detach = function (audioNodeId) {
            if (audioNodeId && _this.privStreams[audioNodeId]) {
                _this.privStreams[audioNodeId].close();
                delete _this.privStreams[audioNodeId];
                _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
            }
        };
        this.turnOff = function () {
            for (var streamId in _this.privStreams) {
                if (streamId) {
                    var stream = _this.privStreams[streamId];
                    if (stream && !stream.isClosed) {
                        stream.close();
                    }
                }
            }
            _this.onEvent(new Exports_1.AudioSourceOffEvent(_this.privId)); // no stream now
            return Exports_1.PromiseHelper.fromResult(true);
        };
        this.upload = function (audioNodeId) {
            return _this.turnOn()
                .onSuccessContinueWith(function (_) {
                var stream = new Exports_1.Stream(audioNodeId);
                _this.privStreams[audioNodeId] = stream;
                var reader = new FileReader();
                var startOffset = 0;
                var endOffset = FileAudioSource.CHUNK_SIZE;
                var processNextChunk = function (event) {
                    if (stream.isClosed) {
                        return; // output stream was closed (somebody called TurnOff). We're done here.
                    }
                    stream.write(reader.result);
                    if (endOffset < _this.privFile.size) {
                        startOffset = endOffset;
                        endOffset = Math.min(endOffset + FileAudioSource.CHUNK_SIZE, _this.privFile.size);
                        var chunk_1 = _this.privFile.slice(startOffset, endOffset);
                        reader.readAsArrayBuffer(chunk_1);
                    }
                    else {
                        // we've written the entire file to the output stream, can close it now.
                        stream.close();
                    }
                };
                reader.onload = processNextChunk;
                reader.onerror = function (event) {
                    var errorMsg = "Error occurred while processing '" + _this.privFile.name + "'. " + event;
                    _this.onEvent(new Exports_1.AudioStreamNodeErrorEvent(_this.privId, audioNodeId, errorMsg));
                    throw new Error(errorMsg);
                };
                var chunk = _this.privFile.slice(startOffset, endOffset);
                reader.readAsArrayBuffer(chunk);
                return stream.getReader();
            });
        };
        this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        this.privId = audioSourceId ? audioSourceId : Exports_1.createNoDashGuid();
        this.privEvents = new Exports_1.EventSource();
        this.privFile = file;
    }
    Object.defineProperty(FileAudioSource.prototype, "format", {
        get: function () {
            return FileAudioSource.FILEFORMAT;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileAudioSource.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    // Recommended sample rate (bytes/second).
    FileAudioSource.SAMPLE_RATE = 16000 * 2; // 16 kHz * 16 bits
    // We should stream audio at no faster than 2x real-time (i.e., send five chunks
    // per second, with the chunk size == sample rate in bytes per second * 2 / 5).
    FileAudioSource.CHUNK_SIZE = FileAudioSource.SAMPLE_RATE * 2 / 5;
    FileAudioSource.UPLOAD_INTERVAL = 200; // milliseconds
    // 10 seconds of audio in bytes =
    // sample rate (bytes/second) * 600 (seconds) + 44 (size of the wave header).
    FileAudioSource.MAX_SIZE = FileAudioSource.SAMPLE_RATE * 600 + 44;
    FileAudioSource.FILEFORMAT = AudioStreamFormat_1.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
    return FileAudioSource;
}());
exports.FileAudioSource = FileAudioSource;



/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var OpusRecorder = /** @class */ (function () {
    function OpusRecorder(options) {
        var _this = this;
        this.record = function (context, mediaStream, outputStream) {
            var mediaRecorder = new MediaRecorder(mediaStream, _this.privMediaRecorderOptions);
            var timeslice = 100; // this is in ms - 100 ensures that the chunk doesn't exceed the max size of chunk allowed in WS connection
            mediaRecorder.ondataavailable = function (dataAvailableEvent) {
                if (outputStream) {
                    var reader_1 = new FileReader();
                    reader_1.readAsArrayBuffer(dataAvailableEvent.data);
                    reader_1.onloadend = function (event) {
                        outputStream.write(reader_1.result);
                    };
                }
            };
            _this.privMediaResources = {
                recorder: mediaRecorder,
                stream: mediaStream,
            };
            mediaRecorder.start(timeslice);
        };
        this.releaseMediaResources = function (context) {
            if (_this.privMediaResources.recorder.state !== "inactive") {
                _this.privMediaResources.recorder.stop();
            }
            _this.privMediaResources.stream.getTracks().forEach(function (track) { return track.stop(); });
        };
        this.privMediaRecorderOptions = options;
    }
    return OpusRecorder;
}());
exports.OpusRecorder = OpusRecorder;
/* Declaring this inline to avoid compiler warnings
declare class MediaRecorder {
    constructor(mediaStream: MediaStream, options: any);

    public state: string;

    public ondataavailable(dataAvailableEvent: any): void;
    public stop(): void;
}*/



/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var PcmRecorder = /** @class */ (function () {
    function PcmRecorder() {
        var _this = this;
        this.record = function (context, mediaStream, outputStream) {
            var desiredSampleRate = 16000;
            var scriptNode = (function () {
                var bufferSize = 0;
                try {
                    return context.createScriptProcessor(bufferSize, 1, 1);
                }
                catch (error) {
                    // Webkit (<= version 31) requires a valid bufferSize.
                    bufferSize = 2048;
                    var audioSampleRate = context.sampleRate;
                    while (bufferSize < 16384 && audioSampleRate >= (2 * desiredSampleRate)) {
                        bufferSize <<= 1;
                        audioSampleRate >>= 1;
                    }
                    return context.createScriptProcessor(bufferSize, 1, 1);
                }
            })();
            var waveStreamEncoder = new Exports_1.RiffPcmEncoder(context.sampleRate, desiredSampleRate);
            var needHeader = true;
            var that = _this;
            scriptNode.onaudioprocess = function (event) {
                var inputFrame = event.inputBuffer.getChannelData(0);
                if (outputStream && !outputStream.isClosed) {
                    var waveFrame = waveStreamEncoder.encode(needHeader, inputFrame);
                    if (!!waveFrame) {
                        outputStream.write(waveFrame);
                        needHeader = false;
                    }
                }
            };
            var micInput = context.createMediaStreamSource(mediaStream);
            _this.privMediaResources = {
                scriptProcessorNode: scriptNode,
                source: micInput,
                stream: mediaStream,
            };
            micInput.connect(scriptNode);
            scriptNode.connect(context.destination);
        };
        this.releaseMediaResources = function (context) {
            if (_this.privMediaResources) {
                if (_this.privMediaResources.scriptProcessorNode) {
                    _this.privMediaResources.scriptProcessorNode.disconnect(context.destination);
                    _this.privMediaResources.scriptProcessorNode = null;
                }
                if (_this.privMediaResources.source) {
                    _this.privMediaResources.source.disconnect();
                    _this.privMediaResources.stream.getTracks().forEach(function (track) { return track.stop(); });
                    _this.privMediaResources.source = null;
                }
            }
        };
    }
    return PcmRecorder;
}());
exports.PcmRecorder = PcmRecorder;



/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var SessionStorage = /** @class */ (function () {
    function SessionStorage() {
        this.get = function (key) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            return sessionStorage.getItem(key);
        };
        this.getOrAdd = function (key, valueToAdd) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            var value = sessionStorage.getItem(key);
            if (value === null || value === undefined) {
                sessionStorage.setItem(key, valueToAdd);
            }
            return sessionStorage.getItem(key);
        };
        this.set = function (key, value) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            sessionStorage.setItem(key, value);
        };
        this.remove = function (key) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            sessionStorage.removeItem(key);
        };
    }
    return SessionStorage;
}());
exports.SessionStorage = SessionStorage;



/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var WebsocketMessageAdapter_1 = __webpack_require__(18);
var WebsocketConnection = /** @class */ (function () {
    function WebsocketConnection(uri, queryParameters, headers, messageFormatter, connectionId) {
        var _this = this;
        this.privIsDisposed = false;
        this.dispose = function () {
            _this.privIsDisposed = true;
            if (_this.privConnectionMessageAdapter) {
                _this.privConnectionMessageAdapter.close();
            }
        };
        this.isDisposed = function () {
            return _this.privIsDisposed;
        };
        this.state = function () {
            return _this.privConnectionMessageAdapter.state;
        };
        this.open = function () {
            return _this.privConnectionMessageAdapter.open();
        };
        this.send = function (message) {
            return _this.privConnectionMessageAdapter.send(message);
        };
        this.read = function () {
            return _this.privConnectionMessageAdapter.read();
        };
        if (!uri) {
            throw new Exports_1.ArgumentNullError("uri");
        }
        if (!messageFormatter) {
            throw new Exports_1.ArgumentNullError("messageFormatter");
        }
        this.privMessageFormatter = messageFormatter;
        var queryParams = "";
        var i = 0;
        if (queryParameters) {
            for (var paramName in queryParameters) {
                if (paramName) {
                    queryParams += ((i === 0) && (uri.indexOf("?") === -1)) ? "?" : "&";
                    var val = encodeURIComponent(queryParameters[paramName]);
                    queryParams += paramName + "=" + val;
                    i++;
                }
            }
        }
        if (headers) {
            for (var headerName in headers) {
                if (headerName) {
                    queryParams += i === 0 ? "?" : "&";
                    var val = encodeURIComponent(headers[headerName]);
                    queryParams += headerName + "=" + val;
                    i++;
                }
            }
        }
        this.privUri = uri + queryParams;
        this.privId = connectionId ? connectionId : Exports_1.createNoDashGuid();
        this.privConnectionMessageAdapter = new WebsocketMessageAdapter_1.WebsocketMessageAdapter(this.privUri, this.id, this.privMessageFormatter);
    }
    Object.defineProperty(WebsocketConnection.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebsocketConnection.prototype, "events", {
        get: function () {
            return this.privConnectionMessageAdapter.events;
        },
        enumerable: true,
        configurable: true
    });
    return WebsocketConnection;
}());
exports.WebsocketConnection = WebsocketConnection;



/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function() {
  throw new Error(
    'ws does not work in the browser. Browser clients must use the native ' +
      'WebSocket object'
  );
};


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var ReplayableAudioNode = /** @class */ (function () {
    function ReplayableAudioNode(audioSource, format) {
        var _this = this;
        this.privBuffers = [];
        this.privReplayOffset = 0;
        this.privLastShrinkOffset = 0;
        this.privBufferStartOffset = 0;
        this.privBufferSerial = 0;
        this.privBufferedBytes = 0;
        this.privReplay = false;
        this.id = function () {
            return _this.privAudioNode.id();
        };
        this.privAudioNode = audioSource;
        this.privFormat = format;
    }
    // Reads and returns the next chunk of audio buffer.
    // If replay of existing buffers are needed, read() will first seek and replay
    // existing content, and upoin completion it will read new content from the underlying
    // audio node, saving that content into the replayable buffers.
    ReplayableAudioNode.prototype.read = function () {
        var _this = this;
        // if there is a replay request to honor.
        if (!!this.privReplay && this.privBuffers.length !== 0) {
            // Find the start point in the buffers.
            // Offsets are in 100ns increments.
            // So how many bytes do we need to seek to get the right offset?
            var offsetToSeek = this.privReplayOffset - this.privBufferStartOffset;
            var bytesToSeek = Math.round(offsetToSeek * this.privFormat.avgBytesPerSec * 1e-7);
            if (0 !== (bytesToSeek % 2)) {
                bytesToSeek++;
            }
            var i = 0;
            while (i < this.privBuffers.length && bytesToSeek >= this.privBuffers[i].buffer.byteLength) {
                bytesToSeek -= this.privBuffers[i++].buffer.byteLength;
            }
            var retVal = this.privBuffers[i].buffer.slice(bytesToSeek);
            this.privReplayOffset += (retVal.byteLength / this.privFormat.avgBytesPerSec) * 1e+7;
            // If we've reached the end of the buffers, stop replaying.
            if (i === this.privBuffers.length - 1) {
                this.privReplay = false;
            }
            return Exports_1.PromiseHelper.fromResult({
                buffer: retVal,
                isEnd: false,
            });
        }
        return this.privAudioNode.read()
            .onSuccessContinueWith(function (result) {
            if (result.buffer) {
                _this.privBuffers.push(new BufferEntry(result.buffer, _this.privBufferSerial++, _this.privBufferedBytes));
                _this.privBufferedBytes += result.buffer.byteLength;
            }
            return result;
        });
    };
    ReplayableAudioNode.prototype.detach = function () {
        this.privAudioNode.detach();
        this.privBuffers = undefined;
    };
    ReplayableAudioNode.prototype.replay = function () {
        if (0 !== this.privBuffers.length) {
            this.privReplay = true;
            this.privReplayOffset = this.privLastShrinkOffset;
        }
    };
    // Shrinks the existing audio buffers to start at the new offset, or at the
    // beginnign of the buffer closest to the requested offset.
    // A replay request will start from the last shrink point.
    ReplayableAudioNode.prototype.shrinkBuffers = function (offset) {
        this.privLastShrinkOffset = offset;
        // Find the start point in the buffers.
        // Offsets are in 100ns increments.
        // So how many bytes do we need to seek to get the right offset?
        var offsetToSeek = offset - this.privBufferStartOffset;
        var bytesToSeek = Math.round(offsetToSeek * this.privFormat.avgBytesPerSec * 1e-7);
        var i = 0;
        while (i < this.privBuffers.length && bytesToSeek >= this.privBuffers[i].buffer.byteLength) {
            bytesToSeek -= this.privBuffers[i++].buffer.byteLength;
        }
        this.privBufferStartOffset = Math.round(offset - ((bytesToSeek / this.privFormat.avgBytesPerSec) * 1e+7));
        this.privBuffers = this.privBuffers.slice(i);
    };
    return ReplayableAudioNode;
}());
exports.ReplayableAudioNode = ReplayableAudioNode;
// Primary use of this class is to help debugging problems with the replay
// code. If the memory cost of alloc / dealloc gets too much, drop it and just use
// the ArrayBuffer directly.
// tslint:disable-next-line:max-classes-per-file
var BufferEntry = /** @class */ (function () {
    function BufferEntry(buffer, serial, byteOffset) {
        this.buffer = buffer;
        this.serial = serial;
        this.byteOffset = byteOffset;
    }
    return BufferEntry;
}());



/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(6);
var Exports_2 = __webpack_require__(0);
var AudioInputStream_1 = __webpack_require__(19);
/**
 * Represents audio input configuration used for specifying what type of input to use (microphone, file, stream).
 * @class AudioConfig
 */
var AudioConfig = /** @class */ (function () {
    function AudioConfig() {
    }
    /**
     * Creates an AudioConfig object representing the default microphone on the system.
     * @member AudioConfig.fromDefaultMicrophoneInput
     * @function
     * @public
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromDefaultMicrophoneInput = function () {
        var pcmRecorder = new Exports_1.PcmRecorder();
        return new AudioConfigImpl(new Exports_1.MicAudioSource(pcmRecorder));
    };
    /**
     * Creates an AudioConfig object representing a microphone on the system based on the specified constraints.
     * @member AudioConfig.fromMicrophoneInput
     * @function
     * @public
     * @param {MediaStreamConstraints} constraints A MediaStreamConstraints object specifying the requirements for microphone media device.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromMicrophoneInput = function (constraints) {
        var pcmRecorder = new Exports_1.PcmRecorder();
        return new AudioConfigImpl(new Exports_1.MicAudioSource(pcmRecorder, constraints));
    };
    /**
     * Creates an AudioConfig object representing the specified file.
     * @member AudioConfig.fromWavFileInput
     * @function
     * @public
     * @param {File} fileName - Specifies the audio input file. Currently, only WAV / PCM with 16-bit
     *        samples, 16 kHz sample rate, and a single channel (Mono) is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromWavFileInput = function (file) {
        return new AudioConfigImpl(new Exports_1.FileAudioSource(file));
    };
    /**
     * Creates an AudioConfig object representing the specified stream.
     * @member AudioConfig.fromStreamInput
     * @function
     * @public
     * @param {AudioInputStream | PullAudioInputStreamCallback} audioStream - Specifies the custom audio input
     *        stream. Currently, only WAV / PCM with 16-bit samples, 16 kHz sample rate, and a single channel
     *        (Mono) is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromStreamInput = function (audioStream) {
        if (audioStream instanceof Exports_2.PullAudioInputStreamCallback) {
            return new AudioConfigImpl(new AudioInputStream_1.PullAudioInputStreamImpl(audioStream));
        }
        if (audioStream instanceof Exports_2.AudioInputStream) {
            return new AudioConfigImpl(audioStream);
        }
        throw new Error("Not Supported Type");
    };
    return AudioConfig;
}());
exports.AudioConfig = AudioConfig;
/**
 * Represents audio input stream used for custom audio input configurations.
 * @private
 * @class AudioConfigImpl
 */
// tslint:disable-next-line:max-classes-per-file
var AudioConfigImpl = /** @class */ (function (_super) {
    __extends(AudioConfigImpl, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {IAudioSource} source - An audio source.
     */
    function AudioConfigImpl(source) {
        var _this = _super.call(this) || this;
        _this.privSource = source;
        return _this;
    }
    Object.defineProperty(AudioConfigImpl.prototype, "format", {
        /**
         * Format information for the audio
         */
        get: function () {
            return this.privSource.format;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @member AudioConfigImpl.prototype.close
     * @function
     * @public
     */
    AudioConfigImpl.prototype.close = function () {
        this.privSource.turnOff();
    };
    /**
     * @member AudioConfigImpl.prototype.id
     * @function
     * @public
     */
    AudioConfigImpl.prototype.id = function () {
        return this.privSource.id();
    };
    /**
     * @member AudioConfigImpl.prototype.turnOn
     * @function
     * @public
     * @returns {Promise<boolean>} A promise.
     */
    AudioConfigImpl.prototype.turnOn = function () {
        return this.privSource.turnOn();
    };
    /**
     * @member AudioConfigImpl.prototype.attach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     * @returns {Promise<IAudioStreamNode>} A promise.
     */
    AudioConfigImpl.prototype.attach = function (audioNodeId) {
        return this.privSource.attach(audioNodeId);
    };
    /**
     * @member AudioConfigImpl.prototype.detach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     */
    AudioConfigImpl.prototype.detach = function (audioNodeId) {
        return this.detach(audioNodeId);
    };
    /**
     * @member AudioConfigImpl.prototype.turnOff
     * @function
     * @public
     * @returns {Promise<boolean>} A promise.
     */
    AudioConfigImpl.prototype.turnOff = function () {
        return this.privSource.turnOff();
    };
    Object.defineProperty(AudioConfigImpl.prototype, "events", {
        /**
         * @member AudioConfigImpl.prototype.events
         * @function
         * @public
         * @returns {EventSource<AudioSourceEvent>} An event source for audio events.
         */
        get: function () {
            return this.privSource.events;
        },
        enumerable: true,
        configurable: true
    });
    return AudioConfigImpl;
}(AudioConfig));
exports.AudioConfigImpl = AudioConfigImpl;



/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines the possible reasons a recognition result might be canceled.
 * @class CancellationReason
 */
var CancellationReason;
(function (CancellationReason) {
    /**
     * Indicates that an error occurred during speech recognition.
     * @member CancellationReason.Error
     */
    CancellationReason[CancellationReason["Error"] = 0] = "Error";
    /**
     * Indicates that the end of the audio stream was reached.
     * @member CancellationReason.EndOfStream
     */
    CancellationReason[CancellationReason["EndOfStream"] = 1] = "EndOfStream";
})(CancellationReason = exports.CancellationReason || (exports.CancellationReason = {}));



/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/**
 * An abstract base class that defines callback methods (read() and close()) for
 * custom audio input streams).
 * @class PullAudioInputStreamCallback
 */
var PullAudioInputStreamCallback = /** @class */ (function () {
    function PullAudioInputStreamCallback() {
    }
    return PullAudioInputStreamCallback;
}());
exports.PullAudioInputStreamCallback = PullAudioInputStreamCallback;



/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Contracts_1 = __webpack_require__(4);
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



/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines content for session events like SessionStarted/Stopped, SoundStarted/Stopped.
 * @class SessionEventArgs
 */
var SessionEventArgs = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} sessionId - The session id.
     */
    function SessionEventArgs(sessionId) {
        this.privSessionId = sessionId;
    }
    Object.defineProperty(SessionEventArgs.prototype, "sessionId", {
        /**
         * Represents the session identifier.
         * @member SessionEventArgs.prototype.sessionId
         * @function
         * @public
         * @returns {string} Represents the session identifier.
         */
        get: function () {
            return this.privSessionId;
        },
        enumerable: true,
        configurable: true
    });
    return SessionEventArgs;
}());
exports.SessionEventArgs = SessionEventArgs;



/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
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



/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Define Speech Recognizer output formats.
 * @class OutputFormat
 */
var OutputFormat;
(function (OutputFormat) {
    /**
     * @member OutputFormat.Simple
     */
    OutputFormat[OutputFormat["Simple"] = 0] = "Simple";
    /**
     * @member OutputFormat.Detailed
     */
    OutputFormat[OutputFormat["Detailed"] = 1] = "Detailed";
})(OutputFormat = exports.OutputFormat || (exports.OutputFormat = {}));



/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Intent recognition result event arguments.
 * @class
 */
var IntentRecognitionEventArgs = /** @class */ (function (_super) {
    __extends(IntentRecognitionEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param result - The result of the intent recognition.
     * @param offset - The offset.
     * @param sessionId - The session id.
     */
    function IntentRecognitionEventArgs(result, offset, sessionId) {
        var _this = _super.call(this, offset, sessionId) || this;
        _this.privResult = result;
        return _this;
    }
    Object.defineProperty(IntentRecognitionEventArgs.prototype, "result", {
        /**
         * Represents the intent recognition result.
         * @member IntentRecognitionEventArgs.prototype.result
         * @function
         * @public
         * @returns {IntentRecognitionResult} Represents the intent recognition result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return IntentRecognitionEventArgs;
}(Exports_1.RecognitionEventArgs));
exports.IntentRecognitionEventArgs = IntentRecognitionEventArgs;



/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines result of speech recognition.
 * @class RecognitionResult
 */
var RecognitionResult = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    function RecognitionResult(resultId, reason, text, duration, offset, errorDetails, json, properties) {
        this.privResultId = resultId;
        this.privReason = reason;
        this.privText = text;
        this.privDuration = duration;
        this.privOffset = offset;
        this.privErrorDetails = errorDetails;
        this.privJson = json;
        this.privProperties = properties;
    }
    Object.defineProperty(RecognitionResult.prototype, "resultId", {
        /**
         * Specifies the result identifier.
         * @member RecognitionResult.prototype.resultId
         * @function
         * @public
         * @returns {string} Specifies the result identifier.
         */
        get: function () {
            return this.privResultId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "reason", {
        /**
         * Specifies status of the result.
         * @member RecognitionResult.prototype.reason
         * @function
         * @public
         * @returns {ResultReason} Specifies status of the result.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "text", {
        /**
         * Presents the recognized text in the result.
         * @member RecognitionResult.prototype.text
         * @function
         * @public
         * @returns {string} Presents the recognized text in the result.
         */
        get: function () {
            return this.privText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "duration", {
        /**
         * Duration of recognized speech in 100 nano second incements.
         * @member RecognitionResult.prototype.duration
         * @function
         * @public
         * @returns {number} Duration of recognized speech in 100 nano second incements.
         */
        get: function () {
            return this.privDuration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "offset", {
        /**
         * Offset of recognized speech in 100 nano second incements.
         * @member RecognitionResult.prototype.offset
         * @function
         * @public
         * @returns {number} Offset of recognized speech in 100 nano second incements.
         */
        get: function () {
            return this.privOffset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member RecognitionResult.prototype.errorDetails
         * @function
         * @public
         * @returns {string} a brief description of an error.
         */
        get: function () {
            return this.privErrorDetails;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "json", {
        /**
         * A string containing Json serialized recognition result as it was received from the service.
         * @member RecognitionResult.prototype.json
         * @function
         * @private
         * @returns {string} Json serialized representation of the result.
         */
        get: function () {
            return this.privJson;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "properties", {
        /**
         *  The set of properties exposed in the result.
         * @member RecognitionResult.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The set of properties exposed in the result.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionResult;
}());
exports.RecognitionResult = RecognitionResult;



/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Defines result of speech recognition.
 * @class SpeechRecognitionResult
 */
var SpeechRecognitionResult = /** @class */ (function (_super) {
    __extends(SpeechRecognitionResult, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @public
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    function SpeechRecognitionResult(resultId, reason, text, duration, offset, errorDetails, json, properties) {
        return _super.call(this, resultId, reason, text, duration, offset, errorDetails, json, properties) || this;
    }
    return SpeechRecognitionResult;
}(Exports_1.RecognitionResult));
exports.SpeechRecognitionResult = SpeechRecognitionResult;



/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Intent recognition result.
 * @class
 */
var IntentRecognitionResult = /** @class */ (function (_super) {
    __extends(IntentRecognitionResult, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param intentId - The intent id.
     * @param resultId - The result id.
     * @param reason - The reason.
     * @param text - The recognized text.
     * @param duration - The duration.
     * @param offset - The offset into the stream.
     * @param errorDetails - Error details, if provided.
     * @param json - Additional Json, if provided.
     * @param properties - Additional properties, if provided.
     */
    function IntentRecognitionResult(intentId, resultId, reason, text, duration, offset, errorDetails, json, properties) {
        var _this = _super.call(this, resultId, reason, text, duration, offset, errorDetails, json, properties) || this;
        _this.privIntentId = intentId;
        return _this;
    }
    Object.defineProperty(IntentRecognitionResult.prototype, "intentId", {
        /**
         * A String that represents the intent identifier being recognized.
         * @member IntentRecognitionResult.prototype.intentId
         * @function
         * @public
         * @returns {string} A String that represents the intent identifier being recognized.
         */
        get: function () {
            return this.privIntentId;
        },
        enumerable: true,
        configurable: true
    });
    return IntentRecognitionResult;
}(Exports_1.SpeechRecognitionResult));
exports.IntentRecognitionResult = IntentRecognitionResult;



/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

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
var Contracts_1 = __webpack_require__(4);
/**
 * Language understanding model
 * @class LanguageUnderstandingModel
 */
var LanguageUnderstandingModel = /** @class */ (function () {
    /**
     * Creates and initializes a new instance
     * @constructor
     */
    function LanguageUnderstandingModel() {
    }
    /**
     * Creates an language understanding model using the specified endpoint.
     * @member LanguageUnderstandingModel.fromEndpoint
     * @function
     * @public
     * @param {URL} uri - A String that represents the endpoint of the language understanding model.
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    LanguageUnderstandingModel.fromEndpoint = function (uri) {
        Contracts_1.Contracts.throwIfNull(uri, "uri");
        Contracts_1.Contracts.throwIfNullOrWhitespace(uri.hostname, "uri");
        var langModelImp = new LanguageUnderstandingModelImpl();
        // Need to extract the app ID from the URL.
        // URL is in the format: https://<region>.api.cognitive.microsoft.com/luis/v2.0/apps/<Guid>?subscription-key=<key>&timezoneOffset=-360
        // Start tearing the string apart.
        // region can be extracted from the host name.
        var firstDot = uri.host.indexOf(".");
        if (-1 === firstDot) {
            throw new Error("Could not determine region from endpoint");
        }
        langModelImp.region = uri.host.substr(0, firstDot);
        // Now the app ID.
        var lastSegment = uri.pathname.lastIndexOf("/") + 1;
        if (-1 === lastSegment) {
            throw new Error("Could not determine appId from endpoint");
        }
        langModelImp.appId = uri.pathname.substr(lastSegment);
        // And finally the key.
        langModelImp.subscriptionKey = uri.searchParams.get("subscription-key");
        if (undefined === langModelImp.subscriptionKey) {
            throw new Error("Could not determine subscription key from endpoint");
        }
        return langModelImp;
    };
    /**
     * Creates an language understanding model using the application id of Language Understanding service.
     * @member LanguageUnderstandingModel.fromAppId
     * @function
     * @public
     * @param {string} appId - A String that represents the application id of Language Understanding service.
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    LanguageUnderstandingModel.fromAppId = function (appId) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(appId, "appId");
        var langModelImp = new LanguageUnderstandingModelImpl();
        langModelImp.appId = appId;
        return langModelImp;
    };
    /**
     * Creates a language understanding model using hostname, subscription key and application
     * id of Language Understanding service.
     * @member LanguageUnderstandingModel.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - A String that represents the subscription key of
     *        Language Understanding service.
     * @param {string} appId - A String that represents the application id of Language
     *        Understanding service.
     * @param {LanguageUnderstandingModel} region - A String that represents the region
     *        of the Language Understanding service (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    LanguageUnderstandingModel.fromSubscription = function (subscriptionKey, appId, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts_1.Contracts.throwIfNullOrWhitespace(appId, "appId");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var langModelImp = new LanguageUnderstandingModelImpl();
        langModelImp.appId = appId;
        langModelImp.region = region;
        langModelImp.subscriptionKey = subscriptionKey;
        return langModelImp;
    };
    return LanguageUnderstandingModel;
}());
exports.LanguageUnderstandingModel = LanguageUnderstandingModel;
/**
 * @private
 * @class LanguageUnderstandingModelImpl
 */
// tslint:disable-next-line:max-classes-per-file
var LanguageUnderstandingModelImpl = /** @class */ (function (_super) {
    __extends(LanguageUnderstandingModelImpl, _super);
    function LanguageUnderstandingModelImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return LanguageUnderstandingModelImpl;
}(LanguageUnderstandingModel));
exports.LanguageUnderstandingModelImpl = LanguageUnderstandingModelImpl;



/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Defines contents of speech recognizing/recognized event.
 * @class SpeechRecognitionEventArgs
 */
var SpeechRecognitionEventArgs = /** @class */ (function (_super) {
    __extends(SpeechRecognitionEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {SpeechRecognitionResult} result - The speech recognition result.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    function SpeechRecognitionEventArgs(result, offset, sessionId) {
        var _this = _super.call(this, offset, sessionId) || this;
        _this.privResult = result;
        return _this;
    }
    Object.defineProperty(SpeechRecognitionEventArgs.prototype, "result", {
        /**
         * Specifies the recognition result.
         * @member SpeechRecognitionEventArgs.prototype.result
         * @function
         * @public
         * @returns {SpeechRecognitionResult} the recognition result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechRecognitionEventArgs;
}(Exports_1.RecognitionEventArgs));
exports.SpeechRecognitionEventArgs = SpeechRecognitionEventArgs;



/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Defines content of a RecognitionErrorEvent.
 * @class SpeechRecognitionCanceledEventArgs
 */
var SpeechRecognitionCanceledEventArgs = /** @class */ (function (_super) {
    __extends(SpeechRecognitionCanceledEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    function SpeechRecognitionCanceledEventArgs(reason, errorDetails, errorCode, offset, sessionId) {
        var _this = _super.call(this, offset, sessionId) || this;
        _this.privReason = reason;
        _this.privErrorDetails = errorDetails;
        _this.privErrorCode = errorCode;
        return _this;
    }
    Object.defineProperty(SpeechRecognitionCanceledEventArgs.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member SpeechRecognitionCanceledEventArgs.prototype.reason
         * @function
         * @public
         * @returns {CancellationReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognitionCanceledEventArgs.prototype, "errorCode", {
        /**
         * The error code in case of an unsuccessful recognition.
         * Added in version 1.1.0.
         * @return An error code that represents the error reason.
         */
        get: function () {
            return this.privErrorCode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognitionCanceledEventArgs.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member SpeechRecognitionCanceledEventArgs.prototype.errorDetails
         * @function
         * @public
         * @returns {string} A String that represents the error details.
         */
        get: function () {
            return this.privErrorDetails;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechRecognitionCanceledEventArgs;
}(Exports_1.RecognitionEventArgs));
exports.SpeechRecognitionCanceledEventArgs = SpeechRecognitionCanceledEventArgs;



/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Translation text result event arguments.
 * @class TranslationRecognitionEventArgs
 */
var TranslationRecognitionEventArgs = /** @class */ (function (_super) {
    __extends(TranslationRecognitionEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {TranslationRecognitionResult} result - The translation recognition result.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    function TranslationRecognitionEventArgs(result, offset, sessionId) {
        var _this = _super.call(this, offset, sessionId) || this;
        _this.privResult = result;
        return _this;
    }
    Object.defineProperty(TranslationRecognitionEventArgs.prototype, "result", {
        /**
         * Specifies the recognition result.
         * @member TranslationRecognitionEventArgs.prototype.result
         * @function
         * @public
         * @returns {TranslationRecognitionResult} the recognition result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationRecognitionEventArgs;
}(Exports_1.RecognitionEventArgs));
exports.TranslationRecognitionEventArgs = TranslationRecognitionEventArgs;



/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Translation Synthesis event arguments
 * @class TranslationSynthesisEventArgs
 */
var TranslationSynthesisEventArgs = /** @class */ (function (_super) {
    __extends(TranslationSynthesisEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {TranslationSynthesisResult} result - The translation synthesis result.
     * @param {string} sessionId - The session id.
     */
    function TranslationSynthesisEventArgs(result, sessionId) {
        var _this = _super.call(this, sessionId) || this;
        _this.privResult = result;
        return _this;
    }
    Object.defineProperty(TranslationSynthesisEventArgs.prototype, "result", {
        /**
         * Specifies the translation synthesis result.
         * @member TranslationSynthesisEventArgs.prototype.result
         * @function
         * @public
         * @returns {TranslationSynthesisResult} Specifies the translation synthesis result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationSynthesisEventArgs;
}(Exports_1.SessionEventArgs));
exports.TranslationSynthesisEventArgs = TranslationSynthesisEventArgs;



/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Translation text result.
 * @class TranslationRecognitionResult
 */
var TranslationRecognitionResult = /** @class */ (function (_super) {
    __extends(TranslationRecognitionResult, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {Translations} translations - The translations.
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    function TranslationRecognitionResult(translations, resultId, reason, text, duration, offset, errorDetails, json, properties) {
        var _this = _super.call(this, resultId, reason, text, duration, offset, errorDetails, json, properties) || this;
        _this.privTranslations = translations;
        return _this;
    }
    Object.defineProperty(TranslationRecognitionResult.prototype, "translations", {
        /**
         * Presents the translation results. Each item in the dictionary represents
         * a translation result in one of target languages, where the key is the name
         * of the target language, in BCP-47 format, and the value is the translation
         * text in the specified language.
         * @member TranslationRecognitionResult.prototype.translations
         * @function
         * @public
         * @returns {Translations} the current translation map that holds all translations requested.
         */
        get: function () {
            return this.privTranslations;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationRecognitionResult;
}(Exports_1.SpeechRecognitionResult));
exports.TranslationRecognitionResult = TranslationRecognitionResult;



/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines translation synthesis result, i.e. the voice output of the translated
 * text in the target language.
 * @class TranslationSynthesisResult
 */
var TranslationSynthesisResult = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {ResultReason} reason - The synthesis reason.
     * @param {ArrayBuffer} audio - The audio data.
     */
    function TranslationSynthesisResult(reason, audio) {
        this.privReason = reason;
        this.privAudio = audio;
    }
    Object.defineProperty(TranslationSynthesisResult.prototype, "audio", {
        /**
         * Translated text in the target language.
         * @member TranslationSynthesisResult.prototype.audio
         * @function
         * @public
         * @returns {ArrayBuffer} Translated audio in the target language.
         */
        get: function () {
            return this.privAudio;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationSynthesisResult.prototype, "reason", {
        /**
         * The synthesis status.
         * @member TranslationSynthesisResult.prototype.reason
         * @function
         * @public
         * @returns {ResultReason} The synthesis status.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationSynthesisResult;
}());
exports.TranslationSynthesisResult = TranslationSynthesisResult;



/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines the possible reasons a recognition result might be generated.
 * @class ResultReason
 */
var ResultReason;
(function (ResultReason) {
    /**
     * Indicates speech could not be recognized. More details
     * can be found in the NoMatchDetails object.
     * @member ResultReason.NoMatch
     */
    ResultReason[ResultReason["NoMatch"] = 0] = "NoMatch";
    /**
     * Indicates that the recognition was canceled. More details
     * can be found using the CancellationDetails object.
     * @member ResultReason.Canceled
     */
    ResultReason[ResultReason["Canceled"] = 1] = "Canceled";
    /**
     * Indicates the speech result contains hypothesis text.
     * @member ResultReason.RecognizedSpeech
     */
    ResultReason[ResultReason["RecognizingSpeech"] = 2] = "RecognizingSpeech";
    /**
     * Indicates the speech result contains final text that has been recognized.
     * Speech Recognition is now complete for this phrase.
     * @member ResultReason.RecognizedSpeech
     */
    ResultReason[ResultReason["RecognizedSpeech"] = 3] = "RecognizedSpeech";
    /**
     * Indicates the intent result contains hypothesis text and intent.
     * @member ResultReason.RecognizingIntent
     */
    ResultReason[ResultReason["RecognizingIntent"] = 4] = "RecognizingIntent";
    /**
     * Indicates the intent result contains final text and intent.
     * Speech Recognition and Intent determination are now complete for this phrase.
     * @member ResultReason.RecognizedIntent
     */
    ResultReason[ResultReason["RecognizedIntent"] = 5] = "RecognizedIntent";
    /**
     * Indicates the translation result contains hypothesis text and its translation(s).
     * @member ResultReason.TranslatingSpeech
     */
    ResultReason[ResultReason["TranslatingSpeech"] = 6] = "TranslatingSpeech";
    /**
     * Indicates the translation result contains final text and corresponding translation(s).
     * Speech Recognition and Translation are now complete for this phrase.
     * @member ResultReason.TranslatedSpeech
     */
    ResultReason[ResultReason["TranslatedSpeech"] = 7] = "TranslatedSpeech";
    /**
     * Indicates the synthesized audio result contains a non-zero amount of audio data
     * @member ResultReason.SynthesizingAudio
     */
    ResultReason[ResultReason["SynthesizingAudio"] = 8] = "SynthesizingAudio";
    /**
     * Indicates the synthesized audio is now complete for this phrase.
     * @member ResultReason.SynthesizingAudioCompleted
     */
    ResultReason[ResultReason["SynthesizingAudioCompleted"] = 9] = "SynthesizingAudioCompleted";
})(ResultReason = exports.ResultReason || (exports.ResultReason = {}));



/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(2);
var Contracts_1 = __webpack_require__(4);
var Exports_2 = __webpack_require__(0);
/**
 * Speech configuration.
 * @class SpeechConfig
 */
var SpeechConfig = /** @class */ (function () {
    /**
     * Creates and initializes an instance.
     * @constructor
     */
    function SpeechConfig() {
    }
    /**
     * Static instance of SpeechConfig returned by passing subscriptionKey and service region.
     * Note: Please use your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechConfig} The speech factory
     */
    SpeechConfig.fromSubscription = function (subscriptionKey, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var speechImpl = new SpeechConfigImpl();
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_IntentRegion, region);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        return speechImpl;
    };
    /**
     * Creates an instance of the speech factory with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or paramters.
     * the language setting in uri takes precedence, and the effective language is "de-DE".
     * Note: Please use your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key.
     * @returns {SpeechConfig} A speech factory instance.
     */
    SpeechConfig.fromEndpoint = function (endpoint, subscriptionKey) {
        Contracts_1.Contracts.throwIfNull(endpoint, "endpoint");
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        var speechImpl = new SpeechConfigImpl();
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint, endpoint.href);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        return speechImpl;
    };
    /**
     * Creates an instance of the speech factory with specified initial authorization token and region.
     * Note: Please use a token derived from your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The initial authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechConfig} A speech factory instance.
     */
    SpeechConfig.fromAuthorizationToken = function (authorizationToken, region) {
        Contracts_1.Contracts.throwIfNull(authorizationToken, "authorizationToken");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var speechImpl = new SpeechConfigImpl();
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_IntentRegion, region);
        speechImpl.authorizationToken = authorizationToken;
        return speechImpl;
    };
    /**
     * Closes the configuration.
     * @member SpeechConfig.prototype.close
     * @function
     * @public
     */
    /* tslint:disable:no-empty */
    SpeechConfig.prototype.close = function () { };
    return SpeechConfig;
}());
exports.SpeechConfig = SpeechConfig;
/**
 * @private
 * @class SpeechConfigImpl
 */
// tslint:disable-next-line:max-classes-per-file
var SpeechConfigImpl = /** @class */ (function (_super) {
    __extends(SpeechConfigImpl, _super);
    function SpeechConfigImpl() {
        var _this = _super.call(this) || this;
        _this.privProperties = new Exports_2.PropertyCollection();
        _this.speechRecognitionLanguage = "en-US"; // Should we have a default?
        _this.outputFormat = Exports_2.OutputFormat.Simple;
        return _this;
    }
    Object.defineProperty(SpeechConfigImpl.prototype, "properties", {
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "endPoint", {
        get: function () {
            return new URL(this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "subscriptionKey", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Key);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "region", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Region);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "authorizationToken", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "speechRecognitionLanguage", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "outputFormat", {
        get: function () {
            return Exports_2.OutputFormat[this.privProperties.getProperty(Exports_1.OutputFormatPropertyName, undefined)];
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_1.OutputFormatPropertyName, Exports_2.OutputFormat[value]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "endpointId", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId);
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId, value);
        },
        enumerable: true,
        configurable: true
    });
    SpeechConfigImpl.prototype.setProperty = function (name, value) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
        this.privProperties.setProperty(name, value);
    };
    SpeechConfigImpl.prototype.getProperty = function (name, def) {
        return this.privProperties.getProperty(name, def);
    };
    SpeechConfigImpl.prototype.clone = function () {
        var ret = new SpeechConfigImpl();
        ret.privProperties = this.privProperties.clone();
        return ret;
    };
    return SpeechConfigImpl;
}(SpeechConfig));
exports.SpeechConfigImpl = SpeechConfigImpl;



/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var IAuthentication_1 = __webpack_require__(10);
var AuthHeader = "Ocp-Apim-Subscription-Key";
/**
 * @class
 */
var CognitiveSubscriptionKeyAuthentication = /** @class */ (function () {
    /**
     * Creates and initializes an instance of the CognitiveSubscriptionKeyAuthentication class.
     * @constructor
     * @param {string} subscriptionKey - The subscription key
     */
    function CognitiveSubscriptionKeyAuthentication(subscriptionKey) {
        var _this = this;
        /**
         * Fetches the subscription key.
         * @member
         * @function
         * @public
         * @param {string} authFetchEventId - The id to fetch.
         */
        this.fetch = function (authFetchEventId) {
            return Exports_1.PromiseHelper.fromResult(_this.privAuthInfo);
        };
        /**
         * Fetches the subscription key.
         * @member
         * @function
         * @public
         * @param {string} authFetchEventId - The id to fetch.
         */
        this.fetchOnExpiry = function (authFetchEventId) {
            return Exports_1.PromiseHelper.fromResult(_this.privAuthInfo);
        };
        if (!subscriptionKey) {
            throw new Exports_1.ArgumentNullError("subscriptionKey");
        }
        this.privAuthInfo = new IAuthentication_1.AuthInfo(AuthHeader, subscriptionKey);
    }
    return CognitiveSubscriptionKeyAuthentication;
}());
exports.CognitiveSubscriptionKeyAuthentication = CognitiveSubscriptionKeyAuthentication;



/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var IAuthentication_1 = __webpack_require__(10);
var AuthHeader = "Authorization";
var CognitiveTokenAuthentication = /** @class */ (function () {
    function CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) {
        var _this = this;
        this.fetch = function (authFetchEventId) {
            return _this.privFetchCallback(authFetchEventId).onSuccessContinueWith(function (token) { return new IAuthentication_1.AuthInfo(AuthHeader, token); });
        };
        this.fetchOnExpiry = function (authFetchEventId) {
            return _this.privFetchOnExpiryCallback(authFetchEventId).onSuccessContinueWith(function (token) { return new IAuthentication_1.AuthInfo(AuthHeader, token); });
        };
        if (!fetchCallback) {
            throw new Exports_1.ArgumentNullError("fetchCallback");
        }
        if (!fetchOnExpiryCallback) {
            throw new Exports_1.ArgumentNullError("fetchOnExpiryCallback");
        }
        this.privFetchCallback = fetchCallback;
        this.privFetchOnExpiryCallback = fetchOnExpiryCallback;
    }
    return CognitiveTokenAuthentication;
}());
exports.CognitiveTokenAuthentication = CognitiveTokenAuthentication;



/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(6);
var Exports_2 = __webpack_require__(1);
var Exports_3 = __webpack_require__(0);
var Exports_4 = __webpack_require__(2);
var TestHooksParamName = "testhooks";
var ConnectionIdHeader = "X-ConnectionId";
var IntentConnectionFactory = /** @class */ (function () {
    function IntentConnectionFactory() {
        var _this = this;
        this.create = function (config, authInfo, connectionId) {
            var endpoint = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Endpoint);
            if (!endpoint) {
                var region = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_IntentRegion);
                endpoint = _this.host() + Exports_2.Storage.local.getOrAdd("TranslationRelativeUri", "/speech/" + _this.getSpeechRegionFromIntentRegion(region) + "/recognition/interactive/cognitiveservices/v1");
            }
            var queryParams = {
                format: "simple",
                language: config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_RecoLanguage),
            };
            if (_this.isDebugModeEnabled) {
                queryParams[TestHooksParamName] = "1";
            }
            var headers = {};
            headers[authInfo.headerName] = authInfo.token;
            headers[ConnectionIdHeader] = connectionId;
            return new Exports_1.WebsocketConnection(endpoint, queryParams, headers, new Exports_4.WebsocketMessageFormatter(), connectionId);
        };
    }
    IntentConnectionFactory.prototype.host = function () {
        return Exports_2.Storage.local.getOrAdd("Host", "wss://speech.platform.bing.com");
    };
    Object.defineProperty(IntentConnectionFactory.prototype, "isDebugModeEnabled", {
        get: function () {
            var value = Exports_2.Storage.local.getOrAdd("IsDebugModeEnabled", "false");
            return value.toLowerCase() === "true";
        },
        enumerable: true,
        configurable: true
    });
    IntentConnectionFactory.prototype.getSpeechRegionFromIntentRegion = function (intentRegion) {
        switch (intentRegion) {
            case "West US":
            case "US West":
            case "westus":
                return "uswest";
            case "West US 2":
            case "US West 2":
            case "westus2":
                return "uswest2";
            case "South Central US":
            case "US South Central":
            case "southcentralus":
                return "ussouthcentral";
            case "West Central US":
            case "US West Central":
            case "westcentralus":
                return "uswestcentral";
            case "East US":
            case "US East":
            case "eastus":
                return "useast";
            case "East US 2":
            case "US East 2":
            case "eastus2":
                return "useast2";
            case "West Europe":
            case "Europe West":
            case "westeurope":
                return "europewest";
            case "North Europe":
            case "Europe North":
            case "northeurope":
                return "europenorth";
            case "Brazil South":
            case "South Brazil":
            case "southbrazil":
                return "brazilsouth";
            case "Australia East":
            case "East Australia":
            case "eastaustralia":
                return "australiaeast";
            case "Southeast Asia":
            case "Asia Southeast":
            case "southeastasia":
                return "asiasoutheast";
            case "East Asia":
            case "Asia East":
            case "eastasia":
                return "asiaeast";
            default:
                return intentRegion;
        }
    };
    return IntentConnectionFactory;
}());
exports.IntentConnectionFactory = IntentConnectionFactory;



/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(6);
var Exports_2 = __webpack_require__(1);
var Exports_3 = __webpack_require__(0);
var Exports_4 = __webpack_require__(2);
var SpeechConnectionMessage_Internal_1 = __webpack_require__(66);
var ServiceRecognizerBase = /** @class */ (function () {
    function ServiceRecognizerBase(authentication, connectionFactory, audioSource, recognizerConfig, recognizer) {
        var _this = this;
        this.sendTelemetryData = function (requestSession, telemetryData) {
            if (ServiceRecognizerBase.telemetryDataEnabled !== true ||
                _this.privIsDisposed) {
                return Exports_2.PromiseHelper.fromResult(true);
            }
            if (!!ServiceRecognizerBase.telemetryData) {
                try {
                    ServiceRecognizerBase.telemetryData(telemetryData);
                    /* tslint:disable:no-empty */
                }
                catch (_a) { }
            }
            return _this.fetchConnection(requestSession).onSuccessContinueWithPromise(function (connection) {
                return connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Text, "telemetry", requestSession.requestId, "application/json", telemetryData));
            });
        };
        this.fetchConnection = function (requestSession) {
            return _this.configureConnection(requestSession);
        };
        this.configureConnection = function (requestSession, isUnAuthorized) {
            if (isUnAuthorized === void 0) { isUnAuthorized = false; }
            if (_this.privConnectionConfigurationPromise) {
                if (_this.privConnectionConfigurationPromise.result().isCompleted &&
                    (_this.privConnectionConfigurationPromise.result().isError
                        || _this.privConnectionConfigurationPromise.result().result.state() === Exports_2.ConnectionState.Disconnected)) {
                    _this.privConnectionId = null;
                    _this.privConnectionConfigurationPromise = null;
                    return _this.configureConnection(requestSession);
                }
                else {
                    // requestSession.onConnectionEstablishCompleted(200);
                    return _this.privConnectionConfigurationPromise;
                }
            }
            _this.privAuthFetchEventId = Exports_2.createNoDashGuid();
            _this.privConnectionId = Exports_2.createNoDashGuid();
            requestSession.onPreConnectionStart(_this.privAuthFetchEventId, _this.privConnectionId);
            var authPromise = isUnAuthorized ? _this.privAuthentication.fetchOnExpiry(_this.privAuthFetchEventId) : _this.privAuthentication.fetch(_this.privAuthFetchEventId);
            _this.privConnectionConfigurationPromise = authPromise
                .continueWithPromise(function (result) {
                if (result.isError) {
                    requestSession.onAuthCompleted(true, result.error);
                    throw new Error(result.error);
                }
                else {
                    requestSession.onAuthCompleted(false);
                }
                var connection = _this.privConnectionFactory.create(_this.privRecognizerConfig, result.result, _this.privConnectionId);
                requestSession.listenForServiceTelemetry(connection.events);
                return connection.open().onSuccessContinueWithPromise(function (response) {
                    if (response.statusCode === 200) {
                        requestSession.onPreConnectionStart(_this.privAuthFetchEventId, _this.privConnectionId);
                        requestSession.onConnectionEstablishCompleted(response.statusCode);
                        //  requestSession.listenForServiceTelemetry(this.privConnectionFetchPromise.result().result.events);
                        return _this.sendSpeechConfig(connection, requestSession, _this.privRecognizerConfig.platformConfig.serialize())
                            .onSuccessContinueWithPromise(function (_) {
                            return _this.sendSpeechContext(connection, requestSession, requestSession.contextJson).onSuccessContinueWith(function (_) {
                                return connection;
                            });
                        });
                    }
                    else if (response.statusCode === 403 && !isUnAuthorized) {
                        return _this.configureConnection(requestSession, true);
                    }
                    else {
                        requestSession.onConnectionEstablishCompleted(response.statusCode, response.reason);
                        return Exports_2.PromiseHelper.fromError("Unable to contact server. StatusCode: " + response.statusCode + ", " + _this.privRecognizerConfig.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Endpoint) + " Reason: " + response.reason);
                    }
                });
            });
            return _this.privConnectionConfigurationPromise;
        };
        this.receiveMessage = function (requestSession, successCallback, errorCallBack) {
            return _this.fetchConnection(requestSession).onSuccessContinueWithPromise(function (connection) {
                return connection.read()
                    .onSuccessContinueWithPromise(function (message) {
                    if (_this.privIsDisposed) {
                        // We're done.
                        return Exports_2.PromiseHelper.fromResult(true);
                    }
                    // indicates we are draining the queue and it came with no message;
                    if (!message) {
                        if (requestSession.isCompleted) {
                            return Exports_2.PromiseHelper.fromResult(true);
                        }
                        else {
                            return _this.receiveMessage(requestSession, successCallback, errorCallBack);
                        }
                    }
                    var connectionMessage = SpeechConnectionMessage_Internal_1.SpeechConnectionMessage.fromConnectionMessage(message);
                    if (connectionMessage.requestId.toLowerCase() === requestSession.requestId.toLowerCase()) {
                        switch (connectionMessage.path.toLowerCase()) {
                            case "turn.start":
                                _this.privMustReportEndOfStream = true;
                                break;
                            case "speech.startdetected":
                                var speechStartDetected = Exports_4.SpeechDetected.fromJSON(connectionMessage.textBody);
                                var speechStartEventArgs = new Exports_3.RecognitionEventArgs(speechStartDetected.Offset, requestSession.sessionId);
                                if (!!_this.privRecognizer.speechStartDetected) {
                                    _this.privRecognizer.speechStartDetected(_this.privRecognizer, speechStartEventArgs);
                                }
                                break;
                            case "speech.enddetected":
                                var json = void 0;
                                if (connectionMessage.textBody.length > 0) {
                                    json = connectionMessage.textBody;
                                }
                                else {
                                    // If the request was empty, the JSON returned is empty.
                                    json = "{ Offset: 0 }";
                                }
                                var speechStopDetected = Exports_4.SpeechDetected.fromJSON(json);
                                requestSession.onServiceRecognized(speechStopDetected.Offset + requestSession.currentTurnAudioOffset);
                                var speechStopEventArgs = new Exports_3.RecognitionEventArgs(speechStopDetected.Offset + requestSession.currentTurnAudioOffset, requestSession.sessionId);
                                if (!!_this.privRecognizer.speechEndDetected) {
                                    _this.privRecognizer.speechEndDetected(_this.privRecognizer, speechStopEventArgs);
                                }
                                break;
                            case "turn.end":
                                if (requestSession.isSpeechEnded && _this.privMustReportEndOfStream) {
                                    _this.privMustReportEndOfStream = false;
                                    _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.EndOfStream, Exports_3.CancellationErrorCode.NoError, undefined, successCallback);
                                }
                                var sessionStopEventArgs = new Exports_3.SessionEventArgs(requestSession.sessionId);
                                requestSession.onServiceTurnEndResponse(_this.privRecognizerConfig.isContinuousRecognition);
                                if (!_this.privRecognizerConfig.isContinuousRecognition || requestSession.isSpeechEnded) {
                                    if (!!_this.privRecognizer.sessionStopped) {
                                        _this.privRecognizer.sessionStopped(_this.privRecognizer, sessionStopEventArgs);
                                    }
                                    return Exports_2.PromiseHelper.fromResult(true);
                                }
                                else {
                                    _this.fetchConnection(requestSession).onSuccessContinueWith(function (connection) {
                                        _this.sendSpeechContext(connection, requestSession, requestSession.contextJson);
                                    });
                                }
                            default:
                                _this.processTypeSpecificMessages(connectionMessage, requestSession, connection, successCallback, errorCallBack);
                        }
                    }
                    return _this.receiveMessage(requestSession, successCallback, errorCallBack);
                });
            });
        };
        this.sendSpeechConfig = function (connection, requestSession, speechConfigJson) {
            // filter out anything that is not required for the service to work.
            if (ServiceRecognizerBase.telemetryDataEnabled !== true) {
                var withTelemetry = JSON.parse(speechConfigJson);
                var replacement = {
                    context: {
                        system: withTelemetry.context.system,
                    },
                };
                speechConfigJson = JSON.stringify(replacement);
            }
            if (speechConfigJson && _this.privConnectionId !== _this.privSpeechConfigConnectionId) {
                _this.privSpeechConfigConnectionId = _this.privConnectionId;
                return connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Text, "speech.config", requestSession.requestId, "application/json", speechConfigJson));
            }
            return Exports_2.PromiseHelper.fromResult(true);
        };
        this.sendSpeechContext = function (connection, requestSession, speechContextJson) {
            if (speechContextJson) {
                return connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Text, "speech.context", requestSession.requestId, "application/json", speechContextJson));
            }
            return Exports_2.PromiseHelper.fromResult(true);
        };
        this.sendAudio = function (audioStreamNode, requestSession) {
            // NOTE: Home-baked promises crash ios safari during the invocation
            // of the error callback chain (looks like the recursion is way too deep, and
            // it blows up the stack). The following construct is a stop-gap that does not
            // bubble the error up the callback chain and hence circumvents this problem.
            // TODO: rewrite with ES6 promises.
            var deferred = new Exports_2.Deferred();
            // The time we last sent data to the service.
            var lastSendTime = Date.now();
            var audioFormat = _this.privAudioSource.format;
            var readAndUploadCycle = function (_) {
                // If speech is done, stop sending audio.
                if (!_this.privIsDisposed && !requestSession.isSpeechEnded && !requestSession.isCompleted) {
                    _this.fetchConnection(requestSession).onSuccessContinueWith(function (connection) {
                        audioStreamNode.read().on(function (audioStreamChunk) {
                            // we have a new audio chunk to upload.
                            if (requestSession.isSpeechEnded) {
                                // If service already recognized audio end then dont send any more audio
                                deferred.resolve(true);
                                return;
                            }
                            var payload = (audioStreamChunk.isEnd) ? null : audioStreamChunk.buffer;
                            var uploaded = connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Binary, "audio", requestSession.requestId, null, payload));
                            if (!audioStreamChunk.isEnd) {
                                // Caculate any delay to the audio stream needed. /2 to allow 2x real time transmit rate max.
                                var minSendTime = ((payload.byteLength / audioFormat.avgBytesPerSec) / 2) * 1000;
                                var delay_1 = Math.max(0, (lastSendTime - Date.now() + minSendTime));
                                uploaded.onSuccessContinueWith(function (result) {
                                    setTimeout(function () {
                                        lastSendTime = Date.now();
                                        readAndUploadCycle(result);
                                    }, delay_1);
                                });
                            }
                            else {
                                // the audio stream has been closed, no need to schedule next
                                // read-upload cycle.
                                requestSession.onSpeechEnded();
                                deferred.resolve(true);
                            }
                        }, function (error) {
                            if (requestSession.isSpeechEnded) {
                                // For whatever reason, Reject is used to remove queue subscribers inside
                                // the Queue.DrainAndDispose invoked from DetachAudioNode down below, which
                                // means that sometimes things can be rejected in normal circumstances, without
                                // any errors.
                                deferred.resolve(true); // TODO: remove the argument, it's is completely meaningless.
                            }
                            else {
                                // Only reject, if there was a proper error.
                                deferred.reject(error);
                            }
                        });
                    });
                }
            };
            readAndUploadCycle(true);
            return deferred.promise();
        };
        if (!authentication) {
            throw new Exports_2.ArgumentNullError("authentication");
        }
        if (!connectionFactory) {
            throw new Exports_2.ArgumentNullError("connectionFactory");
        }
        if (!audioSource) {
            throw new Exports_2.ArgumentNullError("audioSource");
        }
        if (!recognizerConfig) {
            throw new Exports_2.ArgumentNullError("recognizerConfig");
        }
        this.privMustReportEndOfStream = false;
        this.privAuthentication = authentication;
        this.privConnectionFactory = connectionFactory;
        this.privAudioSource = audioSource;
        this.privRecognizerConfig = recognizerConfig;
        this.privIsDisposed = false;
        this.privRecognizer = recognizer;
    }
    Object.defineProperty(ServiceRecognizerBase.prototype, "audioSource", {
        get: function () {
            return this.privAudioSource;
        },
        enumerable: true,
        configurable: true
    });
    ServiceRecognizerBase.prototype.isDisposed = function () {
        return this.privIsDisposed;
    };
    ServiceRecognizerBase.prototype.dispose = function (reason) {
        this.privIsDisposed = true;
        if (this.privConnectionConfigurationPromise) {
            this.privConnectionConfigurationPromise.onSuccessContinueWith(function (connection) {
                connection.dispose(reason);
            });
        }
    };
    ServiceRecognizerBase.prototype.recognize = function (speechContextJson, successCallback, errorCallBack) {
        var _this = this;
        var requestSession = new Exports_4.RequestSession(this.privAudioSource.id(), speechContextJson);
        requestSession.listenForServiceTelemetry(this.privAudioSource.events);
        return this.audioSource
            .attach(requestSession.audioNodeId)
            .continueWithPromise(function (result) {
            var audioNode;
            if (result.isError) {
                _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.ConnectionFailure, result.error, successCallback);
                return Exports_2.PromiseHelper.fromError(result.error);
            }
            else {
                audioNode = new Exports_1.ReplayableAudioNode(result.result, _this.audioSource.format);
                requestSession.onAudioSourceAttachCompleted(audioNode, false);
            }
            return _this.configureConnection(requestSession)
                .on(function (_) {
                var sessionStartEventArgs = new Exports_3.SessionEventArgs(requestSession.sessionId);
                if (!!_this.privRecognizer.sessionStarted) {
                    _this.privRecognizer.sessionStarted(_this.privRecognizer, sessionStartEventArgs);
                }
                var messageRetrievalPromise = _this.receiveMessage(requestSession, successCallback, errorCallBack);
                var audioSendPromise = _this.sendAudio(audioNode, requestSession);
                /* tslint:disable:no-empty */
                audioSendPromise.on(function (_) { }, function (error) {
                    _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.RuntimeError, error, successCallback);
                });
                var completionPromise = Exports_2.PromiseHelper.whenAll([messageRetrievalPromise, audioSendPromise]);
                return completionPromise.on(function (r) {
                    requestSession.dispose();
                    _this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                }, function (error) {
                    requestSession.dispose(error);
                    _this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                    _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.RuntimeError, error, successCallback);
                });
            }, function (error) {
                _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.ConnectionFailure, error, successCallback);
            }).on(function () {
                return requestSession.completionPromise;
            }, function (error) {
                _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.RuntimeError, error, successCallback);
            }).onSuccessContinueWithPromise(function (_) {
                return Exports_2.PromiseHelper.fromResult(true);
            });
        });
    };
    // Cancels recognition.
    ServiceRecognizerBase.prototype.cancelRecognitionLocal = function (requestSession, cancellationReason, errorCode, error, cancelRecoCallback) {
        if (!requestSession.isCanceled) {
            requestSession.onCancelled();
            this.cancelRecognition(requestSession.sessionId, requestSession.requestId, cancellationReason, errorCode, error, cancelRecoCallback);
        }
    };
    ServiceRecognizerBase.telemetryDataEnabled = true;
    return ServiceRecognizerBase;
}());
exports.ServiceRecognizerBase = ServiceRecognizerBase;



/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(1);
var PathHeaderName = "path";
var ContentTypeHeaderName = "content-type";
var RequestIdHeaderName = "x-requestid";
var RequestTimestampHeaderName = "x-timestamp";
var SpeechConnectionMessage = /** @class */ (function (_super) {
    __extends(SpeechConnectionMessage, _super);
    function SpeechConnectionMessage(messageType, path, requestId, contentType, body, additionalHeaders, id) {
        var _this = this;
        if (!path) {
            throw new Exports_1.ArgumentNullError("path");
        }
        if (!requestId) {
            throw new Exports_1.ArgumentNullError("requestId");
        }
        var headers = {};
        headers[PathHeaderName] = path;
        headers[RequestIdHeaderName] = requestId;
        headers[RequestTimestampHeaderName] = new Date().toISOString();
        if (contentType) {
            headers[ContentTypeHeaderName] = contentType;
        }
        if (additionalHeaders) {
            for (var headerName in additionalHeaders) {
                if (headerName) {
                    headers[headerName] = additionalHeaders[headerName];
                }
            }
        }
        if (id) {
            _this = _super.call(this, messageType, body, headers, id) || this;
        }
        else {
            _this = _super.call(this, messageType, body, headers) || this;
        }
        _this.privPath = path;
        _this.privRequestId = requestId;
        _this.privContentType = contentType;
        _this.privAdditionalHeaders = additionalHeaders;
        return _this;
    }
    Object.defineProperty(SpeechConnectionMessage.prototype, "path", {
        get: function () {
            return this.privPath;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionMessage.prototype, "requestId", {
        get: function () {
            return this.privRequestId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionMessage.prototype, "contentType", {
        get: function () {
            return this.privContentType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionMessage.prototype, "additionalHeaders", {
        get: function () {
            return this.privAdditionalHeaders;
        },
        enumerable: true,
        configurable: true
    });
    SpeechConnectionMessage.fromConnectionMessage = function (message) {
        var path = null;
        var requestId = null;
        var contentType = null;
        var requestTimestamp = null;
        var additionalHeaders = {};
        if (message.headers) {
            for (var headerName in message.headers) {
                if (headerName) {
                    if (headerName.toLowerCase() === PathHeaderName.toLowerCase()) {
                        path = message.headers[headerName];
                    }
                    else if (headerName.toLowerCase() === RequestIdHeaderName.toLowerCase()) {
                        requestId = message.headers[headerName];
                    }
                    else if (headerName.toLowerCase() === RequestTimestampHeaderName.toLowerCase()) {
                        requestTimestamp = message.headers[headerName];
                    }
                    else if (headerName.toLowerCase() === ContentTypeHeaderName.toLowerCase()) {
                        contentType = message.headers[headerName];
                    }
                    else {
                        additionalHeaders[headerName] = message.headers[headerName];
                    }
                }
            }
        }
        return new SpeechConnectionMessage(message.messageType, path, requestId, contentType, message.body, additionalHeaders, message.id);
    };
    return SpeechConnectionMessage;
}(Exports_1.ConnectionMessage));
exports.SpeechConnectionMessage = SpeechConnectionMessage;



/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var RecognitionMode;
(function (RecognitionMode) {
    RecognitionMode[RecognitionMode["Interactive"] = 0] = "Interactive";
    RecognitionMode[RecognitionMode["Conversation"] = 1] = "Conversation";
    RecognitionMode[RecognitionMode["Dictation"] = 2] = "Dictation";
})(RecognitionMode = exports.RecognitionMode || (exports.RecognitionMode = {}));
var SpeechResultFormat;
(function (SpeechResultFormat) {
    SpeechResultFormat[SpeechResultFormat["Simple"] = 0] = "Simple";
    SpeechResultFormat[SpeechResultFormat["Detailed"] = 1] = "Detailed";
})(SpeechResultFormat = exports.SpeechResultFormat || (exports.SpeechResultFormat = {}));
var RecognizerConfig = /** @class */ (function () {
    function RecognizerConfig(platformConfig, recognitionMode, speechConfig) {
        if (recognitionMode === void 0) { recognitionMode = RecognitionMode.Interactive; }
        this.privRecognitionMode = RecognitionMode.Interactive;
        this.privPlatformConfig = platformConfig ? platformConfig : new PlatformConfig(new Context(null));
        this.privRecognitionMode = recognitionMode;
        this.privRecognitionActivityTimeout = recognitionMode === RecognitionMode.Interactive ? 8000 : 25000;
        this.privSpeechConfig = speechConfig;
    }
    Object.defineProperty(RecognizerConfig.prototype, "parameters", {
        get: function () {
            return this.privSpeechConfig;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "recognitionMode", {
        get: function () {
            return this.privRecognitionMode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "platformConfig", {
        get: function () {
            return this.privPlatformConfig;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "recognitionActivityTimeout", {
        get: function () {
            return this.privRecognitionActivityTimeout;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "isContinuousRecognition", {
        get: function () {
            return this.privRecognitionMode !== RecognitionMode.Interactive;
        },
        enumerable: true,
        configurable: true
    });
    return RecognizerConfig;
}());
exports.RecognizerConfig = RecognizerConfig;
// tslint:disable-next-line:max-classes-per-file
var PlatformConfig = /** @class */ (function () {
    function PlatformConfig(context) {
        var _this = this;
        this.serialize = function () {
            return JSON.stringify(_this, function (key, value) {
                if (value && typeof value === "object") {
                    var replacement = {};
                    for (var k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            replacement[k && k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
                        }
                    }
                    return replacement;
                }
                return value;
            });
        };
        this.context = context;
    }
    Object.defineProperty(PlatformConfig.prototype, "Context", {
        get: function () {
            return this.context;
        },
        enumerable: true,
        configurable: true
    });
    return PlatformConfig;
}());
exports.PlatformConfig = PlatformConfig;
// tslint:disable-next-line:max-classes-per-file
var Context = /** @class */ (function () {
    function Context(os) {
        this.system = new System();
        this.os = os;
    }
    return Context;
}());
exports.Context = Context;
// tslint:disable-next-line:max-classes-per-file
var System = /** @class */ (function () {
    function System() {
        // Note: below will be patched for official builds.
        var SPEECHSDK_CLIENTSDK_VERSION = "1.1.0-alpha.0.1";
        this.name = "SpeechSDK";
        this.version = SPEECHSDK_CLIENTSDK_VERSION;
        this.build = "JavaScript";
        this.lang = "JavaScript";
    }
    return System;
}());
exports.System = System;
// tslint:disable-next-line:max-classes-per-file
var OS = /** @class */ (function () {
    function OS(platform, name, version) {
        this.platform = platform;
        this.name = name;
        this.version = version;
    }
    return OS;
}());
exports.OS = OS;
// tslint:disable-next-line:max-classes-per-file
var Device = /** @class */ (function () {
    function Device(manufacturer, model, version) {
        this.manufacturer = manufacturer;
        this.model = model;
        this.version = version;
    }
    return Device;
}());
exports.Device = Device;



/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var CRLF = "\r\n";
var WebsocketMessageFormatter = /** @class */ (function () {
    function WebsocketMessageFormatter() {
        var _this = this;
        this.toConnectionMessage = function (message) {
            var deferral = new Exports_1.Deferred();
            try {
                if (message.messageType === Exports_1.MessageType.Text) {
                    var textMessage = message.textContent;
                    var headers = {};
                    var body = null;
                    if (textMessage) {
                        var headerBodySplit = textMessage.split("\r\n\r\n");
                        if (headerBodySplit && headerBodySplit.length > 0) {
                            headers = _this.parseHeaders(headerBodySplit[0]);
                            if (headerBodySplit.length > 1) {
                                body = headerBodySplit[1];
                            }
                        }
                    }
                    deferral.resolve(new Exports_1.ConnectionMessage(message.messageType, body, headers, message.id));
                }
                else if (message.messageType === Exports_1.MessageType.Binary) {
                    var binaryMessage = message.binaryContent;
                    var headers = {};
                    var body = null;
                    if (!binaryMessage || binaryMessage.byteLength < 2) {
                        throw new Error("Invalid binary message format. Header length missing.");
                    }
                    var dataView = new DataView(binaryMessage);
                    var headerLength = dataView.getInt16(0);
                    if (binaryMessage.byteLength < headerLength + 2) {
                        throw new Error("Invalid binary message format. Header content missing.");
                    }
                    var headersString = "";
                    for (var i = 0; i < headerLength; i++) {
                        headersString += String.fromCharCode((dataView).getInt8(i + 2));
                    }
                    headers = _this.parseHeaders(headersString);
                    if (binaryMessage.byteLength > headerLength + 2) {
                        body = binaryMessage.slice(2 + headerLength);
                    }
                    deferral.resolve(new Exports_1.ConnectionMessage(message.messageType, body, headers, message.id));
                }
            }
            catch (e) {
                deferral.reject("Error formatting the message. Error: " + e);
            }
            return deferral.promise();
        };
        this.fromConnectionMessage = function (message) {
            var deferral = new Exports_1.Deferred();
            try {
                if (message.messageType === Exports_1.MessageType.Text) {
                    var payload = "" + _this.makeHeaders(message) + CRLF + (message.textBody ? message.textBody : "");
                    deferral.resolve(new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Text, payload, message.id));
                }
                else if (message.messageType === Exports_1.MessageType.Binary) {
                    var headersString = _this.makeHeaders(message);
                    var content = message.binaryBody;
                    var headerInt8Array = new Int8Array(_this.stringToArrayBuffer(headersString));
                    var payload = new ArrayBuffer(2 + headerInt8Array.byteLength + (content ? content.byteLength : 0));
                    var dataView = new DataView(payload);
                    dataView.setInt16(0, headerInt8Array.length);
                    for (var i = 0; i < headerInt8Array.byteLength; i++) {
                        dataView.setInt8(2 + i, headerInt8Array[i]);
                    }
                    if (content) {
                        var bodyInt8Array = new Int8Array(content);
                        for (var i = 0; i < bodyInt8Array.byteLength; i++) {
                            dataView.setInt8(2 + headerInt8Array.byteLength + i, bodyInt8Array[i]);
                        }
                    }
                    deferral.resolve(new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Binary, payload, message.id));
                }
            }
            catch (e) {
                deferral.reject("Error formatting the message. " + e);
            }
            return deferral.promise();
        };
        this.makeHeaders = function (message) {
            var headersString = "";
            if (message.headers) {
                for (var header in message.headers) {
                    if (header) {
                        headersString += header + ": " + message.headers[header] + CRLF;
                    }
                }
            }
            return headersString;
        };
        this.parseHeaders = function (headersString) {
            var headers = {};
            if (headersString) {
                var headerMatches = headersString.match(/[^\r\n]+/g);
                if (headers) {
                    for (var _i = 0, headerMatches_1 = headerMatches; _i < headerMatches_1.length; _i++) {
                        var header = headerMatches_1[_i];
                        if (header) {
                            var separatorIndex = header.indexOf(":");
                            var headerName = separatorIndex > 0 ? header.substr(0, separatorIndex).trim().toLowerCase() : header;
                            var headerValue = separatorIndex > 0 && header.length > (separatorIndex + 1) ?
                                header.substr(separatorIndex + 1).trim() :
                                "";
                            headers[headerName] = headerValue;
                        }
                    }
                }
            }
            return headers;
        };
        this.stringToArrayBuffer = function (str) {
            var buffer = new ArrayBuffer(str.length);
            var view = new DataView(buffer);
            for (var i = 0; i < str.length; i++) {
                view.setUint8(i, str.charCodeAt(i));
            }
            return buffer;
        };
    }
    return WebsocketMessageFormatter;
}());
exports.WebsocketMessageFormatter = WebsocketMessageFormatter;



/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var QueryParameterNames = /** @class */ (function () {
    function QueryParameterNames() {
    }
    Object.defineProperty(QueryParameterNames, "TestHooksParamName", {
        get: function () {
            return "testhooks";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryParameterNames, "ConnectionIdHeader", {
        get: function () {
            return "X-ConnectionId";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryParameterNames, "DeploymentIdParamName", {
        get: function () {
            return "cid";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryParameterNames, "FormatParamName", {
        get: function () {
            return "format";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryParameterNames, "LanguageParamName", {
        get: function () {
            return "language";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryParameterNames, "TranslationFromParamName", {
        get: function () {
            return "from";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryParameterNames, "TranslationToParamName", {
        get: function () {
            return "to";
        },
        enumerable: true,
        configurable: true
    });
    return QueryParameterNames;
}());
exports.QueryParameterNames = QueryParameterNames;



/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(6);
var Exports_2 = __webpack_require__(1);
var Exports_3 = __webpack_require__(0);
var Exports_4 = __webpack_require__(2);
var TestHooksParamName = "testhooks";
var ConnectionIdHeader = "X-ConnectionId";
var TranslationConnectionFactory = /** @class */ (function () {
    function TranslationConnectionFactory() {
        var _this = this;
        this.create = function (config, authInfo, connectionId) {
            var endpoint = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Endpoint, undefined);
            if (!endpoint) {
                var region = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Region, undefined);
                endpoint = _this.host(region) + Exports_2.Storage.local.getOrAdd("TranslationRelativeUri", "/speech/translation/cognitiveservices/v1");
            }
            var queryParams = {
                from: config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_RecoLanguage),
                to: config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_TranslationToLanguages),
            };
            if (_this.isDebugModeEnabled) {
                queryParams[TestHooksParamName] = "1";
            }
            var voiceName = "voice";
            var featureName = "features";
            if (config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_TranslationVoice, undefined) !== undefined) {
                queryParams[voiceName] = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_TranslationVoice);
                queryParams[featureName] = "texttospeech";
            }
            var headers = {};
            headers[authInfo.headerName] = authInfo.token;
            headers[ConnectionIdHeader] = connectionId;
            return new Exports_1.WebsocketConnection(endpoint, queryParams, headers, new Exports_4.WebsocketMessageFormatter(), connectionId);
        };
    }
    TranslationConnectionFactory.prototype.host = function (region) {
        return Exports_2.Storage.local.getOrAdd("Host", "wss://" + region + ".s2s.speech.microsoft.com");
    };
    Object.defineProperty(TranslationConnectionFactory.prototype, "isDebugModeEnabled", {
        get: function () {
            var value = Exports_2.Storage.local.getOrAdd("IsDebugModeEnabled", "false");
            return value.toLowerCase() === "true";
        },
        enumerable: true,
        configurable: true
    });
    return TranslationConnectionFactory;
}());
exports.TranslationConnectionFactory = TranslationConnectionFactory;



/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(0);
var Exports_2 = __webpack_require__(2);
var EnumTranslation = /** @class */ (function () {
    function EnumTranslation() {
    }
    EnumTranslation.implTranslateRecognitionResult = function (recognitionStatus) {
        var reason = Exports_1.ResultReason.Canceled;
        switch (recognitionStatus) {
            case Exports_2.RecognitionStatus.Success:
                reason = Exports_1.ResultReason.RecognizedSpeech;
                break;
            case Exports_2.RecognitionStatus.NoMatch:
            case Exports_2.RecognitionStatus.InitialSilenceTimeout:
            case Exports_2.RecognitionStatus.BabbleTimeout:
            case Exports_2.RecognitionStatus.EndOfDictation:
                reason = Exports_1.ResultReason.NoMatch;
                break;
            case Exports_2.RecognitionStatus.Error:
            default:
                reason = Exports_1.ResultReason.Canceled;
                break;
        }
        return reason;
    };
    EnumTranslation.implTranslateCancelResult = function (recognitionStatus) {
        var reason = Exports_1.CancellationReason.EndOfStream;
        switch (recognitionStatus) {
            case Exports_2.RecognitionStatus.Success:
            case Exports_2.RecognitionStatus.EndOfDictation:
            case Exports_2.RecognitionStatus.NoMatch:
                reason = Exports_1.CancellationReason.EndOfStream;
                break;
            case Exports_2.RecognitionStatus.InitialSilenceTimeout:
            case Exports_2.RecognitionStatus.BabbleTimeout:
            case Exports_2.RecognitionStatus.Error:
            default:
                reason = Exports_1.CancellationReason.Error;
                break;
        }
        return reason;
    };
    return EnumTranslation;
}());
exports.EnumTranslation = EnumTranslation;



/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class SynthesisStatus
 * @private
 */
var SynthesisStatus;
(function (SynthesisStatus) {
    /**
     * The response contains valid audio data.
     * @member SynthesisStatus.Success
     */
    SynthesisStatus[SynthesisStatus["Success"] = 0] = "Success";
    /**
     * Indicates the end of audio data. No valid audio data is included in the message.
     * @member SynthesisStatus.SynthesisEnd
     */
    SynthesisStatus[SynthesisStatus["SynthesisEnd"] = 1] = "SynthesisEnd";
    /**
     * Indicates an error occurred during synthesis data processing.
     * @member SynthesisStatus.Error
     */
    SynthesisStatus[SynthesisStatus["Error"] = 2] = "Error";
})(SynthesisStatus = exports.SynthesisStatus || (exports.SynthesisStatus = {}));
var RecognitionStatus;
(function (RecognitionStatus) {
    RecognitionStatus[RecognitionStatus["Success"] = 0] = "Success";
    RecognitionStatus[RecognitionStatus["NoMatch"] = 1] = "NoMatch";
    RecognitionStatus[RecognitionStatus["InitialSilenceTimeout"] = 2] = "InitialSilenceTimeout";
    RecognitionStatus[RecognitionStatus["BabbleTimeout"] = 3] = "BabbleTimeout";
    RecognitionStatus[RecognitionStatus["Error"] = 4] = "Error";
    RecognitionStatus[RecognitionStatus["EndOfDictation"] = 5] = "EndOfDictation";
})(RecognitionStatus = exports.RecognitionStatus || (exports.RecognitionStatus = {}));



/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(2);
var TranslationSynthesisEnd = /** @class */ (function () {
    function TranslationSynthesisEnd(json) {
        this.privSynthesisEnd = JSON.parse(json);
        this.privSynthesisEnd.SynthesisStatus = Exports_1.SynthesisStatus[this.privSynthesisEnd.SynthesisStatus];
    }
    TranslationSynthesisEnd.fromJSON = function (json) {
        return new TranslationSynthesisEnd(json);
    };
    Object.defineProperty(TranslationSynthesisEnd.prototype, "SynthesisStatus", {
        get: function () {
            return this.privSynthesisEnd.SynthesisStatus;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationSynthesisEnd.prototype, "FailureReason", {
        get: function () {
            return this.privSynthesisEnd.FailureReason;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationSynthesisEnd;
}());
exports.TranslationSynthesisEnd = TranslationSynthesisEnd;



/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var TranslationStatus_1 = __webpack_require__(9);
var TranslationHypothesis = /** @class */ (function () {
    function TranslationHypothesis(json) {
        this.privTranslationHypothesis = JSON.parse(json);
        this.privTranslationHypothesis.Translation.TranslationStatus = TranslationStatus_1.TranslationStatus[this.privTranslationHypothesis.Translation.TranslationStatus];
    }
    TranslationHypothesis.fromJSON = function (json) {
        return new TranslationHypothesis(json);
    };
    Object.defineProperty(TranslationHypothesis.prototype, "Duration", {
        get: function () {
            return this.privTranslationHypothesis.Duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationHypothesis.prototype, "Offset", {
        get: function () {
            return this.privTranslationHypothesis.Offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationHypothesis.prototype, "Text", {
        get: function () {
            return this.privTranslationHypothesis.Text;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationHypothesis.prototype, "Translation", {
        get: function () {
            return this.privTranslationHypothesis.Translation;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationHypothesis;
}());
exports.TranslationHypothesis = TranslationHypothesis;



/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(2);
var TranslationStatus_1 = __webpack_require__(9);
var TranslationPhrase = /** @class */ (function () {
    function TranslationPhrase(json) {
        this.privTranslationPhrase = JSON.parse(json);
        this.privTranslationPhrase.RecognitionStatus = Exports_1.RecognitionStatus[this.privTranslationPhrase.RecognitionStatus];
        if (this.privTranslationPhrase.Translation !== undefined) {
            this.privTranslationPhrase.Translation.TranslationStatus = TranslationStatus_1.TranslationStatus[this.privTranslationPhrase.Translation.TranslationStatus];
        }
    }
    TranslationPhrase.fromJSON = function (json) {
        return new TranslationPhrase(json);
    };
    Object.defineProperty(TranslationPhrase.prototype, "RecognitionStatus", {
        get: function () {
            return this.privTranslationPhrase.RecognitionStatus;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationPhrase.prototype, "Offset", {
        get: function () {
            return this.privTranslationPhrase.Offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationPhrase.prototype, "Duration", {
        get: function () {
            return this.privTranslationPhrase.Duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationPhrase.prototype, "Text", {
        get: function () {
            return this.privTranslationPhrase.Text;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationPhrase.prototype, "Translation", {
        get: function () {
            return this.privTranslationPhrase.Translation;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationPhrase;
}());
exports.TranslationPhrase = TranslationPhrase;



/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(1);
var Exports_2 = __webpack_require__(0);
var Exports_3 = __webpack_require__(2);
// tslint:disable-next-line:max-classes-per-file
var TranslationServiceRecognizer = /** @class */ (function (_super) {
    __extends(TranslationServiceRecognizer, _super);
    function TranslationServiceRecognizer(authentication, connectionFactory, audioSource, recognizerConfig, translationRecognizer) {
        var _this = _super.call(this, authentication, connectionFactory, audioSource, recognizerConfig, translationRecognizer) || this;
        _this.privTranslationRecognizer = translationRecognizer;
        return _this;
    }
    TranslationServiceRecognizer.prototype.processTypeSpecificMessages = function (connectionMessage, requestSession, connection, successCallback, errorCallBack) {
        switch (connectionMessage.path.toLowerCase()) {
            case "translation.hypothesis":
                var result = this.fireEventForResult(Exports_3.TranslationHypothesis.fromJSON(connectionMessage.textBody), requestSession);
                if (!!this.privTranslationRecognizer.recognizing) {
                    try {
                        this.privTranslationRecognizer.recognizing(this.privTranslationRecognizer, result);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;
            case "translation.phrase":
                if (this.privRecognizerConfig.isContinuousRecognition) {
                    // For continuous recognition telemetry has to be sent for every phrase as per spec.
                    this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                }
                var translatedPhrase = Exports_3.TranslationPhrase.fromJSON(connectionMessage.textBody);
                if (translatedPhrase.RecognitionStatus === Exports_3.RecognitionStatus.Success) {
                    // OK, the recognition was successful. How'd the translation do?
                    var result_1 = this.fireEventForResult(translatedPhrase, requestSession);
                    if (!!this.privTranslationRecognizer.recognized) {
                        try {
                            this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, result_1);
                            /* tslint:disable:no-empty */
                        }
                        catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }
                    // report result to promise.
                    if (!!successCallback) {
                        try {
                            successCallback(result_1.result);
                        }
                        catch (e) {
                            if (!!errorCallBack) {
                                errorCallBack(e);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        successCallback = undefined;
                        errorCallBack = undefined;
                    }
                    break;
                }
                else {
                    var reason = Exports_3.EnumTranslation.implTranslateRecognitionResult(translatedPhrase.RecognitionStatus);
                    var result_2 = new Exports_2.TranslationRecognitionResult(undefined, requestSession.requestId, reason, translatedPhrase.Text, translatedPhrase.Duration, translatedPhrase.Offset, undefined, connectionMessage.textBody, undefined);
                    if (reason === Exports_2.ResultReason.Canceled) {
                        var cancelReason = Exports_3.EnumTranslation.implTranslateCancelResult(translatedPhrase.RecognitionStatus);
                        var ev = new Exports_2.TranslationRecognitionCanceledEventArgs(requestSession.sessionId, cancelReason, null, cancelReason === Exports_2.CancellationReason.Error ? Exports_2.CancellationErrorCode.ServiceError : Exports_2.CancellationErrorCode.NoError, result_2);
                        if (!!this.privTranslationRecognizer.canceled) {
                            try {
                                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, ev);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                    }
                    else {
                        if (!(requestSession.isSpeechEnded && reason === Exports_2.ResultReason.NoMatch && translatedPhrase.RecognitionStatus !== Exports_3.RecognitionStatus.InitialSilenceTimeout)) {
                            var ev = new Exports_2.TranslationRecognitionEventArgs(result_2, 0 /*offset*/, requestSession.sessionId);
                            if (!!this.privTranslationRecognizer.recognized) {
                                try {
                                    this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, ev);
                                    /* tslint:disable:no-empty */
                                }
                                catch (error) {
                                    // Not going to let errors in the event handler
                                    // trip things up.
                                }
                            }
                        }
                    }
                    // report result to promise.
                    if (!!successCallback) {
                        try {
                            successCallback(result_2);
                        }
                        catch (e) {
                            if (!!errorCallBack) {
                                errorCallBack(e);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        successCallback = undefined;
                        errorCallBack = undefined;
                    }
                }
                break;
            case "translation.synthesis":
                this.sendSynthesisAudio(connectionMessage.binaryBody, requestSession.sessionId);
                break;
            case "translation.synthesis.end":
                var synthEnd = Exports_3.TranslationSynthesisEnd.fromJSON(connectionMessage.textBody);
                switch (synthEnd.SynthesisStatus) {
                    case Exports_3.SynthesisStatus.Error:
                        if (!!this.privTranslationRecognizer.synthesizing) {
                            var result_3 = new Exports_2.TranslationSynthesisResult(Exports_2.ResultReason.Canceled, undefined);
                            var retEvent = new Exports_2.TranslationSynthesisEventArgs(result_3, requestSession.sessionId);
                            try {
                                this.privTranslationRecognizer.synthesizing(this.privTranslationRecognizer, retEvent);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                        if (!!this.privTranslationRecognizer.canceled) {
                            // And raise a canceled event to send the rich(er) error message back.
                            var canceledResult = new Exports_2.TranslationRecognitionCanceledEventArgs(requestSession.sessionId, Exports_2.CancellationReason.Error, synthEnd.FailureReason, Exports_2.CancellationErrorCode.ServiceError, null);
                            try {
                                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, canceledResult);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                        break;
                    case Exports_3.SynthesisStatus.Success:
                        this.sendSynthesisAudio(undefined, requestSession.sessionId);
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    };
    // Cancels recognition.
    TranslationServiceRecognizer.prototype.cancelRecognition = function (sessionId, requestId, cancellationReason, errorCode, error, cancelRecoCallback) {
        if (!!this.privTranslationRecognizer.canceled) {
            var properties = new Exports_2.PropertyCollection();
            properties.setProperty(Exports_3.CancellationErrorCodePropertyName, Exports_2.CancellationErrorCode[errorCode]);
            var cancelEvent = new Exports_2.TranslationRecognitionCanceledEventArgs(sessionId, cancellationReason, error, errorCode, undefined);
            try {
                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, cancelEvent);
                /* tslint:disable:no-empty */
            }
            catch (_a) { }
            if (!!cancelRecoCallback) {
                var result = new Exports_2.TranslationRecognitionResult(undefined, // Translations
                requestId, Exports_2.ResultReason.Canceled, undefined, // Text
                undefined, // Druation
                undefined, // Offset
                error, undefined, // Json
                properties);
                try {
                    cancelRecoCallback(result);
                    /* tslint:disable:no-empty */
                }
                catch (_b) { }
            }
        }
    };
    TranslationServiceRecognizer.prototype.fireEventForResult = function (serviceResult, requestSession) {
        var translations;
        if (undefined !== serviceResult.Translation.Translations) {
            translations = new Exports_2.Translations();
            for (var _i = 0, _a = serviceResult.Translation.Translations; _i < _a.length; _i++) {
                var translation = _a[_i];
                translations.set(translation.Language, translation.Text);
            }
        }
        var resultReason;
        if (serviceResult instanceof Exports_3.TranslationPhrase) {
            if (serviceResult.Translation.TranslationStatus === Exports_1.TranslationStatus.Success) {
                resultReason = Exports_2.ResultReason.TranslatedSpeech;
            }
            else {
                resultReason = Exports_2.ResultReason.RecognizedSpeech;
            }
        }
        else {
            resultReason = Exports_2.ResultReason.TranslatingSpeech;
        }
        var result = new Exports_2.TranslationRecognitionResult(translations, requestSession.requestId, resultReason, serviceResult.Text, serviceResult.Duration, serviceResult.Offset, serviceResult.Translation.FailureReason, JSON.stringify(serviceResult), undefined);
        var ev = new Exports_2.TranslationRecognitionEventArgs(result, serviceResult.Offset, requestSession.sessionId);
        return ev;
    };
    TranslationServiceRecognizer.prototype.sendSynthesisAudio = function (audio, sessionId) {
        var reason = (undefined === audio) ? Exports_2.ResultReason.SynthesizingAudioCompleted : Exports_2.ResultReason.SynthesizingAudio;
        var result = new Exports_2.TranslationSynthesisResult(reason, audio);
        var retEvent = new Exports_2.TranslationSynthesisEventArgs(result, sessionId);
        if (!!this.privTranslationRecognizer.synthesizing) {
            try {
                this.privTranslationRecognizer.synthesizing(this.privTranslationRecognizer, retEvent);
                /* tslint:disable:no-empty */
            }
            catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    };
    return TranslationServiceRecognizer;
}(Exports_3.ServiceRecognizerBase));
exports.TranslationServiceRecognizer = TranslationServiceRecognizer;



/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var SpeechDetected = /** @class */ (function () {
    function SpeechDetected(json) {
        this.privSpeechStartDetected = JSON.parse(json);
    }
    SpeechDetected.fromJSON = function (json) {
        return new SpeechDetected(json);
    };
    Object.defineProperty(SpeechDetected.prototype, "Offset", {
        get: function () {
            return this.privSpeechStartDetected.Offset;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechDetected;
}());
exports.SpeechDetected = SpeechDetected;



/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var SpeechHypothesis = /** @class */ (function () {
    function SpeechHypothesis(json) {
        this.privSpeechHypothesis = JSON.parse(json);
    }
    SpeechHypothesis.fromJSON = function (json) {
        return new SpeechHypothesis(json);
    };
    Object.defineProperty(SpeechHypothesis.prototype, "Text", {
        get: function () {
            return this.privSpeechHypothesis.Text;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechHypothesis.prototype, "Offset", {
        get: function () {
            return this.privSpeechHypothesis.Offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechHypothesis.prototype, "Duration", {
        get: function () {
            return this.privSpeechHypothesis.Duration;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechHypothesis;
}());
exports.SpeechHypothesis = SpeechHypothesis;



/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
var Exports_2 = __webpack_require__(2);
// tslint:disable-next-line:max-classes-per-file
var SpeechServiceRecognizer = /** @class */ (function (_super) {
    __extends(SpeechServiceRecognizer, _super);
    function SpeechServiceRecognizer(authentication, connectionFactory, audioSource, recognizerConfig, speechRecognizer) {
        var _this = _super.call(this, authentication, connectionFactory, audioSource, recognizerConfig, speechRecognizer) || this;
        _this.privSpeechRecognizer = speechRecognizer;
        return _this;
    }
    SpeechServiceRecognizer.prototype.processTypeSpecificMessages = function (connectionMessage, requestSession, connection, successCallback, errorCallBack) {
        var result;
        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
                var hypothesis = Exports_2.SpeechHypothesis.fromJSON(connectionMessage.textBody);
                result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, Exports_1.ResultReason.RecognizingSpeech, hypothesis.Text, hypothesis.Duration, hypothesis.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                var ev = new Exports_1.SpeechRecognitionEventArgs(result, hypothesis.Duration, requestSession.sessionId);
                if (!!this.privSpeechRecognizer.recognizing) {
                    try {
                        this.privSpeechRecognizer.recognizing(this.privSpeechRecognizer, ev);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;
            case "speech.phrase":
                // Always send telemetry because we want it to to up for recognize once which will listening to the service
                // after recognition happens.
                this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                var simple = Exports_2.SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);
                var resultReason = Exports_2.EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);
                requestSession.onServiceRecognized(requestSession.currentTurnAudioOffset + simple.Offset);
                if (Exports_1.ResultReason.Canceled === resultReason) {
                    var cancelReason = Exports_2.EnumTranslation.implTranslateCancelResult(simple.RecognitionStatus);
                    result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, resultReason, undefined, undefined, undefined, undefined, connectionMessage.textBody, undefined);
                    if (!!this.privSpeechRecognizer.canceled) {
                        var cancelEvent = new Exports_1.SpeechRecognitionCanceledEventArgs(cancelReason, undefined, cancelReason === Exports_1.CancellationReason.Error ? Exports_1.CancellationErrorCode.ServiceError : Exports_1.CancellationErrorCode.NoError, undefined, requestSession.sessionId);
                        try {
                            this.privSpeechRecognizer.canceled(this.privSpeechRecognizer, cancelEvent);
                            /* tslint:disable:no-empty */
                        }
                        catch (_a) { }
                    }
                }
                else {
                    if (!(requestSession.isSpeechEnded && resultReason === Exports_1.ResultReason.NoMatch && simple.RecognitionStatus !== Exports_2.RecognitionStatus.InitialSilenceTimeout)) {
                        if (this.privRecognizerConfig.parameters.getProperty(Exports_2.OutputFormatPropertyName) === Exports_1.OutputFormat[Exports_1.OutputFormat.Simple]) {
                            result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, resultReason, simple.DisplayText, simple.Duration, simple.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                        }
                        else {
                            var detailed = Exports_2.DetailedSpeechPhrase.fromJSON(connectionMessage.textBody);
                            result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, resultReason, detailed.RecognitionStatus === Exports_2.RecognitionStatus.Success ? detailed.NBest[0].Display : undefined, detailed.Duration, detailed.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                        }
                        var event_1 = new Exports_1.SpeechRecognitionEventArgs(result, result.offset, requestSession.sessionId);
                        if (!!this.privSpeechRecognizer.recognized) {
                            try {
                                this.privSpeechRecognizer.recognized(this.privSpeechRecognizer, event_1);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                    }
                }
                // report result to promise.
                if (!!successCallback) {
                    try {
                        successCallback(result);
                    }
                    catch (e) {
                        if (!!errorCallBack) {
                            errorCallBack(e);
                        }
                    }
                    // Only invoke the call back once.
                    // and if it's successful don't invoke the
                    // error after that.
                    successCallback = undefined;
                    errorCallBack = undefined;
                }
                break;
            default:
                break;
        }
    };
    // Cancels recognition.
    SpeechServiceRecognizer.prototype.cancelRecognition = function (sessionId, requestId, cancellationReason, errorCode, error, cancelRecoCallback) {
        var properties = new Exports_1.PropertyCollection();
        properties.setProperty(Exports_2.CancellationErrorCodePropertyName, Exports_1.CancellationErrorCode[errorCode]);
        if (!!this.privSpeechRecognizer.canceled) {
            var cancelEvent = new Exports_1.SpeechRecognitionCanceledEventArgs(cancellationReason, error, errorCode, undefined, sessionId);
            try {
                this.privSpeechRecognizer.canceled(this.privSpeechRecognizer, cancelEvent);
                /* tslint:disable:no-empty */
            }
            catch (_a) { }
        }
        if (!!cancelRecoCallback) {
            var result = new Exports_1.SpeechRecognitionResult(requestId, Exports_1.ResultReason.Canceled, undefined, // Text
            undefined, // Druation
            undefined, // Offset
            error, undefined, // Json
            properties);
            try {
                cancelRecoCallback(result);
                /* tslint:disable:no-empty */
            }
            catch (_b) { }
        }
    };
    return SpeechServiceRecognizer;
}(Exports_2.ServiceRecognizerBase));
exports.SpeechServiceRecognizer = SpeechServiceRecognizer;



/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(2);
var DetailedSpeechPhrase = /** @class */ (function () {
    function DetailedSpeechPhrase(json) {
        this.privDetailedSpeechPhrase = JSON.parse(json);
        this.privDetailedSpeechPhrase.RecognitionStatus = Exports_1.RecognitionStatus[this.privDetailedSpeechPhrase.RecognitionStatus];
    }
    DetailedSpeechPhrase.fromJSON = function (json) {
        return new DetailedSpeechPhrase(json);
    };
    Object.defineProperty(DetailedSpeechPhrase.prototype, "RecognitionStatus", {
        get: function () {
            return this.privDetailedSpeechPhrase.RecognitionStatus;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DetailedSpeechPhrase.prototype, "NBest", {
        get: function () {
            return this.privDetailedSpeechPhrase.NBest;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DetailedSpeechPhrase.prototype, "Duration", {
        get: function () {
            return this.privDetailedSpeechPhrase.Duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DetailedSpeechPhrase.prototype, "Offset", {
        get: function () {
            return this.privDetailedSpeechPhrase.Offset;
        },
        enumerable: true,
        configurable: true
    });
    return DetailedSpeechPhrase;
}());
exports.DetailedSpeechPhrase = DetailedSpeechPhrase;



/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(2);
var SimpleSpeechPhrase = /** @class */ (function () {
    function SimpleSpeechPhrase(json) {
        this.privSimpleSpeechPhrase = JSON.parse(json);
        this.privSimpleSpeechPhrase.RecognitionStatus = Exports_1.RecognitionStatus[this.privSimpleSpeechPhrase.RecognitionStatus];
    }
    SimpleSpeechPhrase.fromJSON = function (json) {
        return new SimpleSpeechPhrase(json);
    };
    Object.defineProperty(SimpleSpeechPhrase.prototype, "RecognitionStatus", {
        get: function () {
            return this.privSimpleSpeechPhrase.RecognitionStatus;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleSpeechPhrase.prototype, "DisplayText", {
        get: function () {
            return this.privSimpleSpeechPhrase.DisplayText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleSpeechPhrase.prototype, "Offset", {
        get: function () {
            return this.privSimpleSpeechPhrase.Offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleSpeechPhrase.prototype, "Duration", {
        get: function () {
            return this.privSimpleSpeechPhrase.Duration;
        },
        enumerable: true,
        configurable: true
    });
    return SimpleSpeechPhrase;
}());
exports.SimpleSpeechPhrase = SimpleSpeechPhrase;



/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class AddedLmIntent
 */
// tslint:disable-next-line:max-classes-per-file
var AddedLmIntent = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param modelImpl - The model.
     * @param intentName - The intent name.
     */
    function AddedLmIntent(modelImpl, intentName) {
        this.modelImpl = modelImpl;
        this.intentName = intentName;
    }
    return AddedLmIntent;
}());
exports.AddedLmIntent = AddedLmIntent;



/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
var Exports_2 = __webpack_require__(2);
// tslint:disable-next-line:max-classes-per-file
var IntentServiceRecognizer = /** @class */ (function (_super) {
    __extends(IntentServiceRecognizer, _super);
    function IntentServiceRecognizer(authentication, connectionFactory, audioSource, recognizerConfig, recognizer, intentDataSent) {
        var _this = _super.call(this, authentication, connectionFactory, audioSource, recognizerConfig, recognizer) || this;
        _this.privIntentRecognizer = recognizer;
        _this.privIntentDataSent = intentDataSent;
        return _this;
    }
    IntentServiceRecognizer.prototype.setIntents = function (addedIntents, umbrellaIntent) {
        this.privAddedLmIntents = addedIntents;
        this.privUmbrellaIntent = umbrellaIntent;
    };
    IntentServiceRecognizer.prototype.processTypeSpecificMessages = function (connectionMessage, requestSession, connection, successCallback, errorCallBack) {
        var _this = this;
        var result;
        var ev;
        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
                var speechHypothesis = Exports_2.SpeechHypothesis.fromJSON(connectionMessage.textBody);
                result = new Exports_1.IntentRecognitionResult(undefined, requestSession.requestId, Exports_1.ResultReason.RecognizingIntent, speechHypothesis.Text, speechHypothesis.Duration, speechHypothesis.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                ev = new Exports_1.IntentRecognitionEventArgs(result, speechHypothesis.Offset + requestSession.currentTurnAudioOffset, requestSession.sessionId);
                if (!!this.privIntentRecognizer.recognizing) {
                    try {
                        this.privIntentRecognizer.recognizing(this.privIntentRecognizer, ev);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;
            case "speech.phrase":
                var simple = Exports_2.SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);
                result = new Exports_1.IntentRecognitionResult(undefined, requestSession.requestId, Exports_2.EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus), simple.DisplayText, simple.Duration, simple.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                ev = new Exports_1.IntentRecognitionEventArgs(result, result.offset + requestSession.currentTurnAudioOffset, requestSession.sessionId);
                var sendEvent = function () {
                    if (_this.privRecognizerConfig.isContinuousRecognition) {
                        // For continuous recognition telemetry has to be sent for every phrase as per spec.
                        _this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                    }
                    if (!!_this.privIntentRecognizer.recognized) {
                        try {
                            _this.privIntentRecognizer.recognized(_this.privIntentRecognizer, ev);
                            /* tslint:disable:no-empty */
                        }
                        catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }
                    // report result to promise.
                    if (!!successCallback) {
                        try {
                            successCallback(result);
                        }
                        catch (e) {
                            if (!!errorCallBack) {
                                errorCallBack(e);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        successCallback = undefined;
                        errorCallBack = undefined;
                    }
                };
                // If intent data was sent, the terminal result for this recognizer is an intent being found.
                // If no intent data was sent, the terminal event is speech recognition being successful.
                if (false === this.privIntentDataSent || Exports_1.ResultReason.NoMatch === ev.result.reason) {
                    sendEvent();
                }
                else {
                    // Squirrel away the args, when the response event arrives it will build upon them
                    // and then return
                    this.privPendingIntentArgs = ev;
                }
                break;
            case "response":
                // Response from LUIS
                if (this.privRecognizerConfig.isContinuousRecognition) {
                    // For continuous recognition telemetry has to be sent for every phrase as per spec.
                    this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                }
                ev = this.privPendingIntentArgs;
                this.privPendingIntentArgs = undefined;
                if (undefined === ev) {
                    if ("" === connectionMessage.textBody) {
                        // This condition happens if there is nothing but silence in the
                        // audio sent to the service.
                        return;
                    }
                    // Odd... Not sure this can happen
                    ev = new Exports_1.IntentRecognitionEventArgs(new Exports_1.IntentRecognitionResult(), 0 /*TODO*/, requestSession.sessionId);
                }
                var intentResponse = Exports_2.IntentResponse.fromJSON(connectionMessage.textBody);
                // If LUIS didn't return anything, send the existing event, else
                // modify it to show the match.
                // See if the intent found is in the list of intents asked for.
                var addedIntent = this.privAddedLmIntents[intentResponse.topScoringIntent.intent];
                if (this.privUmbrellaIntent !== undefined) {
                    addedIntent = this.privUmbrellaIntent;
                }
                if (null !== intentResponse && addedIntent !== undefined) {
                    var intentId = addedIntent.intentName === undefined ? intentResponse.topScoringIntent.intent : addedIntent.intentName;
                    var reason = ev.result.reason;
                    if (undefined !== intentId) {
                        reason = Exports_1.ResultReason.RecognizedIntent;
                    }
                    // make sure, properties is set.
                    var properties = (undefined !== ev.result.properties) ?
                        ev.result.properties : new Exports_1.PropertyCollection();
                    properties.setProperty(Exports_1.PropertyId.LanguageUnderstandingServiceResponse_JsonResult, connectionMessage.textBody);
                    ev = new Exports_1.IntentRecognitionEventArgs(new Exports_1.IntentRecognitionResult(intentId, ev.result.resultId, reason, ev.result.text, ev.result.duration, ev.result.offset + requestSession.currentTurnAudioOffset, ev.result.errorDetails, ev.result.json, properties), ev.offset + requestSession.currentTurnAudioOffset, ev.sessionId);
                }
                if (!!this.privIntentRecognizer.recognized) {
                    try {
                        this.privIntentRecognizer.recognized(this.privIntentRecognizer, ev);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                // report result to promise.
                if (!!successCallback) {
                    try {
                        successCallback(ev.result);
                    }
                    catch (e) {
                        if (!!errorCallBack) {
                            errorCallBack(e);
                        }
                    }
                    // Only invoke the call back once.
                    // and if it's successful don't invoke the
                    // error after that.
                    successCallback = undefined;
                    errorCallBack = undefined;
                }
                break;
            default:
                break;
        }
    };
    // Cancels recognition.
    IntentServiceRecognizer.prototype.cancelRecognition = function (sessionId, requestId, cancellationReason, errorCode, error, cancelRecoCallback) {
        if (!!this.privIntentRecognizer.canceled) {
            var properties = new Exports_1.PropertyCollection();
            properties.setProperty(Exports_2.CancellationErrorCodePropertyName, Exports_1.CancellationErrorCode[errorCode]);
            var cancelEvent = new Exports_1.IntentRecognitionCanceledEventArgs(cancellationReason, error, errorCode, undefined, undefined, sessionId);
            try {
                this.privIntentRecognizer.canceled(this.privIntentRecognizer, cancelEvent);
                /* tslint:disable:no-empty */
            }
            catch (_a) { }
            if (!!cancelRecoCallback) {
                var result = new Exports_1.IntentRecognitionResult(undefined, // Intent Id
                requestId, Exports_1.ResultReason.Canceled, undefined, // Text
                undefined, // Druation
                undefined, // Offset
                error, undefined, // Json
                properties);
                try {
                    cancelRecoCallback(result);
                    /* tslint:disable:no-empty */
                }
                catch (_b) { }
            }
        }
    };
    return IntentServiceRecognizer;
}(Exports_2.ServiceRecognizerBase));
exports.IntentServiceRecognizer = IntentServiceRecognizer;



/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

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



/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var RecognitionEvents_1 = __webpack_require__(11);
var ServiceTelemetryListener_Internal_1 = __webpack_require__(86);
var RequestSession = /** @class */ (function () {
    function RequestSession(audioSourceId, contextJson) {
        var _this = this;
        this.privIsDisposed = false;
        this.privDetachables = new Array();
        this.privIsAudioNodeDetached = false;
        this.privIsCompleted = false;
        this.privIsSpeechEnded = false;
        this.privIsCanceled = false;
        this.privTurnStartAudioOffset = 0;
        this.privLastRecoOffset = 0;
        this.onAudioSourceAttachCompleted = function (audioNode, isError, error) {
            _this.privAudioNode = audioNode;
            if (isError) {
                _this.onComplete();
            }
            else {
                _this.onEvent(new RecognitionEvents_1.ListeningStartedEvent(_this.privRequestId, _this.privSessionId, _this.privAudioSourceId, _this.privAudioNodeId));
            }
        };
        this.onPreConnectionStart = function (authFetchEventId, connectionId) {
            _this.privAuthFetchEventId = authFetchEventId;
            _this.privSessionId = connectionId;
            _this.onEvent(new RecognitionEvents_1.ConnectingToServiceEvent(_this.privRequestId, _this.privAuthFetchEventId, _this.privSessionId));
        };
        this.onAuthCompleted = function (isError, error) {
            if (isError) {
                _this.onComplete();
            }
        };
        this.onConnectionEstablishCompleted = function (statusCode, reason) {
            if (statusCode === 200) {
                _this.onEvent(new RecognitionEvents_1.RecognitionStartedEvent(_this.requestId, _this.privAudioSourceId, _this.privAudioNodeId, _this.privAuthFetchEventId, _this.privSessionId));
                _this.privAudioNode.replay();
                _this.privTurnStartAudioOffset = _this.privLastRecoOffset;
                return;
            }
            else if (statusCode === 403) {
                _this.onComplete();
            }
            else {
                _this.onComplete();
            }
        };
        this.onServiceTurnEndResponse = function (continuousRecognition) {
            if (!continuousRecognition || _this.isSpeechEnded) {
                _this.onComplete();
            }
            else {
                // Start a new request set.
                _this.privTurnStartAudioOffset = _this.privLastRecoOffset;
                _this.privRequestId = Exports_1.createNoDashGuid();
                _this.privAudioNode.replay();
            }
        };
        this.dispose = function (error) {
            if (!_this.privIsDisposed) {
                // we should have completed by now. If we did not its an unknown error.
                _this.privIsDisposed = true;
                for (var _i = 0, _a = _this.privDetachables; _i < _a.length; _i++) {
                    var detachable = _a[_i];
                    detachable.detach();
                }
                _this.privServiceTelemetryListener.dispose();
            }
        };
        this.getTelemetry = function () {
            return _this.privServiceTelemetryListener.getTelemetry();
        };
        this.onEvent = function (event) {
            _this.privServiceTelemetryListener.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        this.onComplete = function () {
            if (!_this.privIsCompleted) {
                _this.privIsCompleted = true;
                _this.detachAudioNode();
            }
        };
        this.detachAudioNode = function () {
            if (!_this.privIsAudioNodeDetached) {
                _this.privIsAudioNodeDetached = true;
                if (_this.privAudioNode) {
                    _this.privAudioNode.detach();
                }
            }
        };
        this.privAudioSourceId = audioSourceId;
        this.privRequestId = Exports_1.createNoDashGuid();
        this.privAudioNodeId = Exports_1.createNoDashGuid();
        this.privRequestCompletionDeferral = new Exports_1.Deferred();
        this.privContextJson = contextJson;
        this.privServiceTelemetryListener = new ServiceTelemetryListener_Internal_1.ServiceTelemetryListener(this.privRequestId, this.privAudioSourceId, this.privAudioNodeId);
        this.onEvent(new RecognitionEvents_1.RecognitionTriggeredEvent(this.requestId, this.privSessionId, this.privAudioSourceId, this.privAudioNodeId));
    }
    Object.defineProperty(RequestSession.prototype, "contextJson", {
        get: function () {
            return this.privContextJson;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "sessionId", {
        get: function () {
            return this.privSessionId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "requestId", {
        get: function () {
            return this.privRequestId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "completionPromise", {
        get: function () {
            return this.privRequestCompletionDeferral.promise();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "isSpeechEnded", {
        get: function () {
            return this.privIsSpeechEnded;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "isCompleted", {
        get: function () {
            return this.privIsCompleted;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "isCanceled", {
        get: function () {
            return this.privIsCanceled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "currentTurnAudioOffset", {
        get: function () {
            return this.privTurnStartAudioOffset;
        },
        enumerable: true,
        configurable: true
    });
    RequestSession.prototype.listenForServiceTelemetry = function (eventSource) {
        this.privDetachables.push(eventSource.attachListener(this.privServiceTelemetryListener));
    };
    RequestSession.prototype.onServiceRecognized = function (offset) {
        this.privLastRecoOffset = offset;
        this.privAudioNode.shrinkBuffers(offset);
    };
    RequestSession.prototype.onCancelled = function () {
        this.privIsCanceled = true;
    };
    // Should be called with the audioNode for this session has indicated that it is out of speech.
    RequestSession.prototype.onSpeechEnded = function () {
        this.privIsSpeechEnded = true;
    };
    return RequestSession;
}());
exports.RequestSession = RequestSession;



/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(1);
var RecognitionEvents_1 = __webpack_require__(11);
// tslint:disable-next-line:max-classes-per-file
var ServiceTelemetryListener = /** @class */ (function () {
    function ServiceTelemetryListener(requestId, audioSourceId, audioNodeId) {
        var _this = this;
        this.privIsDisposed = false;
        this.privListeningTriggerMetric = null;
        this.privMicMetric = null;
        this.privConnectionEstablishMetric = null;
        this.onEvent = function (e) {
            if (_this.privIsDisposed) {
                return;
            }
            if (e instanceof RecognitionEvents_1.RecognitionTriggeredEvent && e.requestId === _this.privRequestId) {
                _this.privListeningTriggerMetric = {
                    End: e.eventTime,
                    Name: "ListeningTrigger",
                    Start: e.eventTime,
                };
            }
            if (e instanceof Exports_1.AudioStreamNodeAttachingEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                _this.privMicStartTime = e.eventTime;
            }
            if (e instanceof Exports_1.AudioStreamNodeAttachedEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                _this.privMicStartTime = e.eventTime;
            }
            if (e instanceof Exports_1.AudioSourceErrorEvent && e.audioSourceId === _this.privAudioSourceId) {
                if (!_this.privMicMetric) {
                    _this.privMicMetric = {
                        End: e.eventTime,
                        Error: e.error,
                        Name: "Microphone",
                        Start: _this.privMicStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.AudioStreamNodeErrorEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                if (!_this.privMicMetric) {
                    _this.privMicMetric = {
                        End: e.eventTime,
                        Error: e.error,
                        Name: "Microphone",
                        Start: _this.privMicStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.AudioStreamNodeDetachedEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                if (!_this.privMicMetric) {
                    _this.privMicMetric = {
                        End: e.eventTime,
                        Name: "Microphone",
                        Start: _this.privMicStartTime,
                    };
                }
            }
            if (e instanceof RecognitionEvents_1.ConnectingToServiceEvent && e.requestId === _this.privRequestId) {
                _this.privConnectionId = e.sessionId;
            }
            if (e instanceof Exports_1.ConnectionStartEvent && e.connectionId === _this.privConnectionId) {
                _this.privConnectionStartTime = e.eventTime;
            }
            if (e instanceof Exports_1.ConnectionEstablishedEvent && e.connectionId === _this.privConnectionId) {
                if (!_this.privConnectionEstablishMetric) {
                    _this.privConnectionEstablishMetric = {
                        End: e.eventTime,
                        Id: _this.privConnectionId,
                        Name: "Connection",
                        Start: _this.privConnectionStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.ConnectionEstablishErrorEvent && e.connectionId === _this.privConnectionId) {
                if (!_this.privConnectionEstablishMetric) {
                    _this.privConnectionEstablishMetric = {
                        End: e.eventTime,
                        Error: _this.getConnectionError(e.statusCode),
                        Id: _this.privConnectionId,
                        Name: "Connection",
                        Start: _this.privConnectionStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.ConnectionMessageReceivedEvent && e.connectionId === _this.privConnectionId) {
                if (e.message && e.message.headers && e.message.headers.path) {
                    if (!_this.privReceivedMessages[e.message.headers.path]) {
                        _this.privReceivedMessages[e.message.headers.path] = new Array();
                    }
                    _this.privReceivedMessages[e.message.headers.path].push(e.networkReceivedTime);
                }
            }
        };
        this.getTelemetry = function () {
            var metrics = new Array();
            if (_this.privListeningTriggerMetric) {
                metrics.push(_this.privListeningTriggerMetric);
            }
            if (_this.privMicMetric) {
                metrics.push(_this.privMicMetric);
            }
            if (_this.privConnectionEstablishMetric) {
                metrics.push(_this.privConnectionEstablishMetric);
            }
            var telemetry = {
                Metrics: metrics,
                ReceivedMessages: _this.privReceivedMessages,
            };
            var json = JSON.stringify(telemetry);
            // We dont want to send the same telemetry again. So clean those out.
            _this.privReceivedMessages = {};
            _this.privListeningTriggerMetric = null;
            _this.privMicMetric = null;
            _this.privConnectionEstablishMetric = null;
            return json;
        };
        this.dispose = function () {
            _this.privIsDisposed = true;
        };
        this.getConnectionError = function (statusCode) {
            /*
            -- Websocket status codes --
            NormalClosure = 1000,
            EndpointUnavailable = 1001,
            ProtocolError = 1002,
            InvalidMessageType = 1003,
            Empty = 1005,
            InvalidPayloadData = 1007,
            PolicyViolation = 1008,
            MessageTooBig = 1009,
            MandatoryExtension = 1010,
            InternalServerError = 1011
            */
            switch (statusCode) {
                case 400:
                case 1002:
                case 1003:
                case 1005:
                case 1007:
                case 1008:
                case 1009: return "BadRequest";
                case 401: return "Unauthorized";
                case 403: return "Forbidden";
                case 503:
                case 1001: return "ServerUnavailable";
                case 500:
                case 1011: return "ServerError";
                case 408:
                case 504: return "Timeout";
                default: return "statuscode:" + statusCode.toString();
            }
        };
        this.privRequestId = requestId;
        this.privAudioSourceId = audioSourceId;
        this.privAudioNodeId = audioNodeId;
        this.privReceivedMessages = {};
    }
    return ServiceTelemetryListener;
}());
exports.ServiceTelemetryListener = ServiceTelemetryListener;



/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(2);
var Contracts_1 = __webpack_require__(4);
var Exports_2 = __webpack_require__(0);
/**
 * Speech translation configuration.
 * @class SpeechTranslationConfig
 */
var SpeechTranslationConfig = /** @class */ (function (_super) {
    __extends(SpeechTranslationConfig, _super);
    /**
     * Creates an instance of recognizer config.
     */
    function SpeechTranslationConfig() {
        return _super.call(this) || this;
    }
    /**
     * Static instance of SpeechTranslationConfig returned by passing a subscription key and service region.
     * @member SpeechTranslationConfig.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    SpeechTranslationConfig.fromSubscription = function (subscriptionKey, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var ret = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        return ret;
    };
    /**
     * Static instance of SpeechTranslationConfig returned by passing authorization token and service region.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     *       expires, the caller needs to refresh it by setting the property authorizationToken with a new
     *       valid token. Otherwise, all the recognizers created by this SpeechTranslationConfig instance
     *      will encounter errors during recognition.
     * @member SpeechTranslationConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    SpeechTranslationConfig.fromAuthorizationToken = function (authorizationToken, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(authorizationToken, "authorizationToken");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var ret = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, authorizationToken);
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        return ret;
    };
    /**
     * Creates an instance of the speech translation config with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or paramters.
     * Note: The query properties specified in the endpoint URL are not changed, even if they are
     *       set by any other APIs. For example, if language is defined in the uri as query parameter
     *       "language=de-DE", and also set by the speechRecognitionLanguage property, the language
     *       setting in uri takes precedence, and the effective language is "de-DE".
     * Only the properties that are not specified in the endpoint URL can be set by other APIs.
     * @member SpeechTranslationConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key.
     * @returns {SpeechTranslationConfig} A speech config instance.
     */
    SpeechTranslationConfig.fromEndpoint = function (endpoint, subscriptionKey) {
        Contracts_1.Contracts.throwIfNull(endpoint, "endpoint");
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        var ret = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint, endpoint.href);
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        return ret;
    };
    return SpeechTranslationConfig;
}(Exports_2.SpeechConfig));
exports.SpeechTranslationConfig = SpeechTranslationConfig;
/**
 * @private
 * @class SpeechTranslationConfigImpl
 */
// tslint:disable-next-line:max-classes-per-file
var SpeechTranslationConfigImpl = /** @class */ (function (_super) {
    __extends(SpeechTranslationConfigImpl, _super);
    function SpeechTranslationConfigImpl() {
        var _this = _super.call(this) || this;
        _this.privSpeechProperties = new Exports_2.PropertyCollection();
        _this.outputFormat = Exports_2.OutputFormat.Simple;
        return _this;
    }
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "authorizationToken", {
        /**
         * Sets the authorization token.
         * If this is set, subscription key is ignored.
         * User needs to make sure the provided authorization token is valid and not expired.
         * @member SpeechTranslationConfigImpl.prototype.authorizationToken
         * @function
         * @public
         * @param {string} value - The authorization token.
         */
        set: function (value) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "speechRecognitionLanguage", {
        /**
         * Sets the authorization token.
         * If this is set, subscription key is ignored.
         * User needs to make sure the provided authorization token is valid and not expired.
         * @member SpeechTranslationConfigImpl.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @param {string} value - The authorization token.
         */
        set: function (value) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "subscriptionKey", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.subscriptionKey
         * @function
         * @public
         */
        get: function () {
            return this.privSpeechProperties.getProperty(Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_Key]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "outputFormat", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.outputFormat
         * @function
         * @public
         */
        get: function () {
            return Exports_2.OutputFormat[this.privSpeechProperties.getProperty(Exports_1.OutputFormatPropertyName, undefined)];
        },
        /**
         * @member SpeechTranslationConfigImpl.prototype.outputFormat
         * @function
         * @public
         */
        set: function (value) {
            this.privSpeechProperties.setProperty(Exports_1.OutputFormatPropertyName, Exports_2.OutputFormat[value]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "endpointId", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.endpointId
         * @function
         * @public
         */
        get: function () {
            return this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId);
        },
        /**
         * @member SpeechTranslationConfigImpl.prototype.endpointId
         * @function
         * @public
         */
        set: function (value) {
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint, value);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfigImpl.prototype.addTargetLanguage
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    SpeechTranslationConfigImpl.prototype.addTargetLanguage = function (value) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
        var languages = this.targetLanguages;
        languages.push(value);
        this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages, languages.join(","));
    };
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "targetLanguages", {
        /**
         * Add a (text) target language to translate into.
         * @member SpeechTranslationConfigImpl.prototype.targetLanguages
         * @function
         * @public
         * @param {string} value - The language such as de-DE
         */
        get: function () {
            if (this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages, undefined) !== undefined) {
                return this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
            }
            else {
                return [];
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "voiceName", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.voiceName
         * @function
         * @public
         */
        get: function () {
            return this.getProperty(Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice]);
        },
        /**
         * Sets voice of the translated language, enable voice synthesis output.
         * @member SpeechTranslationConfigImpl.prototype.voiceName
         * @function
         * @public
         * @param {string} value - The name of the voice.
         */
        set: function (value) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "region", {
        /**
         * Provides the region.
         * @member SpeechTranslationConfigImpl.prototype.region
         * @function
         * @public
         * @returns {string} The region.
         */
        get: function () {
            return this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Region);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Allows for setting arbitrary properties.
     * @member SpeechTranslationConfigImpl.prototype.setProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} value - The value of the property.
     */
    SpeechTranslationConfigImpl.prototype.setProperty = function (name, value) {
        this.privSpeechProperties.setProperty(name, value);
    };
    /**
     * Allows for retrieving arbitrary property values.
     * @member SpeechTranslationConfigImpl.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} def - The default value of the property in case it is not set.
     * @returns {string} The value of the property.
     */
    SpeechTranslationConfigImpl.prototype.getProperty = function (name, def) {
        return this.privSpeechProperties.getProperty(name, def);
    };
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "properties", {
        /**
         * Provides access to custom properties.
         * @member SpeechTranslationConfigImpl.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The properties.
         */
        get: function () {
            return this.privSpeechProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Dispose of associated resources.
     * @member SpeechTranslationConfigImpl.prototype.close
     * @function
     * @public
     */
    SpeechTranslationConfigImpl.prototype.close = function () {
        return;
    };
    return SpeechTranslationConfigImpl;
}(SpeechTranslationConfig));
exports.SpeechTranslationConfigImpl = SpeechTranslationConfigImpl;



/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(0);
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



/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines speech property ids.
 * @class PropertyId
 */
var PropertyId;
(function (PropertyId) {
    /**
     * The Cognitive Services Speech Service subscription Key. If you are using an intent recognizer, you need to specify
     * to specify the LUIS endpoint key for your particular LUIS app. Under normal circumstances, you shouldn't
     * have to use this property directly.
     * Instead, use @see SpeechConfig.fromSubscription.
     * @member PropertyId.SpeechServiceConnection_Key
     */
    PropertyId[PropertyId["SpeechServiceConnection_Key"] = 0] = "SpeechServiceConnection_Key";
    /**
     * The Cognitive Services Speech Service endpoint (url). Under normal circumstances, you shouldn't
     * have to use this property directly.
     * Instead, use @see SpeechConfig.fromEndpoint.
     * NOTE: This endpoint is not the same as the endpoint used to obtain an access token.
     * @member PropertyId.SpeechServiceConnection_Endpoint
     */
    PropertyId[PropertyId["SpeechServiceConnection_Endpoint"] = 1] = "SpeechServiceConnection_Endpoint";
    /**
     * The Cognitive Services Speech Service region. Under normal circumstances, you shouldn't have to
     * use this property directly.
     * Instead, use @see SpeechConfig.fromSubscription, @see SpeechConfig.fromEndpoint, @see SpeechConfig.fromAuthorizationToken.
     * @member PropertyId.SpeechServiceConnection_Region
     */
    PropertyId[PropertyId["SpeechServiceConnection_Region"] = 2] = "SpeechServiceConnection_Region";
    /**
     * The Cognitive Services Speech Service authorization token (aka access token). Under normal circumstances,
     * you shouldn't have to use this property directly.
     * Instead, use @see SpeechConfig.fromAuthorizationToken,
     * @see SpeechRecognizer.setAuthorizationToken, @see IntentRecognizer.setAuthorizationToken, @see TranslationRecognizer.setAuthorizationToken.
     * @member PropertyId.SpeechServiceAuthorization_Token
     */
    PropertyId[PropertyId["SpeechServiceAuthorization_Token"] = 3] = "SpeechServiceAuthorization_Token";
    /**
     * The Cognitive Services Speech Service authorization type. Currently unused.
     * @member PropertyId.SpeechServiceAuthorization_Type
     */
    PropertyId[PropertyId["SpeechServiceAuthorization_Type"] = 4] = "SpeechServiceAuthorization_Type";
    /**
     * The Cognitive Services Custom Speech Service endpoint id. Under normal circumstances, you shouldn't
     * have to use this property directly.
     * Instead, use @see SpeechConfig.setEndpointId.
     * NOTE: The endpoint id is available in the Custom Speech Portal, listed under Endpoint Details.
     * @member PropertyId.SpeechServiceConnection_EndpointId
     */
    PropertyId[PropertyId["SpeechServiceConnection_EndpointId"] = 5] = "SpeechServiceConnection_EndpointId";
    /**
     * The list of comma separated languages (BCP-47 format) used as target translation languages. Under normal circumstances,
     * you shouldn't have to use this property directly.
     * Instead use @see SpeechTranslationConfig.addTargetLanguage,
     * @see SpeechTranslationConfig.getTargetLanguages, @see TranslationRecognizer.getTargetLanguages.
     * @member PropertyId.SpeechServiceConnection_TranslationToLanguages
     */
    PropertyId[PropertyId["SpeechServiceConnection_TranslationToLanguages"] = 6] = "SpeechServiceConnection_TranslationToLanguages";
    /**
     * The name of the Cognitive Service Text to Speech Service Voice. Under normal circumstances, you shouldn't have to use this
     * property directly.
     * Instead, use @see SpeechTranslationConfig.setVoiceName.
     * NOTE: Valid voice names can be found <a href="https://aka.ms/csspeech/voicenames">here</a>.
     * @member PropertyId.SpeechServiceConnection_TranslationVoice
     */
    PropertyId[PropertyId["SpeechServiceConnection_TranslationVoice"] = 7] = "SpeechServiceConnection_TranslationVoice";
    /**
     * Translation features.
     * @member PropertyId.SpeechServiceConnection_TranslationFeatures
     */
    PropertyId[PropertyId["SpeechServiceConnection_TranslationFeatures"] = 8] = "SpeechServiceConnection_TranslationFeatures";
    /**
     * The Language Understanding Service Region. Under normal circumstances, you shouldn't have to use this property directly.
     * Instead, use @see LanguageUnderstandingModel.
     * @member PropertyId.SpeechServiceConnection_IntentRegion
     */
    PropertyId[PropertyId["SpeechServiceConnection_IntentRegion"] = 9] = "SpeechServiceConnection_IntentRegion";
    /**
     * The Cognitive Services Speech Service recognition Mode. Can be "INTERACTIVE", "CONVERSATION", "DICTATION".
     * This property is intended to be read-only. The SDK is using it internally.
     * @member PropertyId.SpeechServiceConnection_RecoMode
     */
    PropertyId[PropertyId["SpeechServiceConnection_RecoMode"] = 10] = "SpeechServiceConnection_RecoMode";
    /**
     * The spoken language to be recognized (in BCP-47 format). Under normal circumstances, you shouldn't have to use this property
     * directly.
     * Instead, use @see SpeechConfig.setSpeechRecognitionLanguage.
     * @member PropertyId.SpeechServiceConnection_RecoLanguage
     */
    PropertyId[PropertyId["SpeechServiceConnection_RecoLanguage"] = 11] = "SpeechServiceConnection_RecoLanguage";
    /**
     * The session id. This id is a universally unique identifier (aka UUID) representing a specific binding of an audio input stream
     * and the underlying speech recognition instance to which it is bound. Under normal circumstances, you shouldn't have to use this
     * property directly.
     * Instead use @see SessionEventArgs.sessionId.
     * @member PropertyId.Speech_SessionId
     */
    PropertyId[PropertyId["Speech_SessionId"] = 12] = "Speech_SessionId";
    /**
     * The requested Cognitive Services Speech Service response output format (simple or detailed). Under normal circumstances, you shouldn't have
     * to use this property directly.
     * Instead use @see SpeechConfig.setOutputFormat.
     * @member PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse
     */
    PropertyId[PropertyId["SpeechServiceResponse_RequestDetailedResultTrueFalse"] = 13] = "SpeechServiceResponse_RequestDetailedResultTrueFalse";
    /**
     * The requested Cognitive Services Speech Service response output profanity level. Currently unused.
     * @member PropertyId.SpeechServiceResponse_RequestProfanityFilterTrueFalse
     */
    PropertyId[PropertyId["SpeechServiceResponse_RequestProfanityFilterTrueFalse"] = 14] = "SpeechServiceResponse_RequestProfanityFilterTrueFalse";
    /**
     * The Cognitive Services Speech Service response output (in JSON format). This property is available on recognition result objects only.
     * @member PropertyId.SpeechServiceResponse_JsonResult
     */
    PropertyId[PropertyId["SpeechServiceResponse_JsonResult"] = 15] = "SpeechServiceResponse_JsonResult";
    /**
     * The Cognitive Services Speech Service error details (in JSON format). Under normal circumstances, you shouldn't have to
     * use this property directly. Instead use @see CancellationDetails.getErrorDetails.
     * @member PropertyId.SpeechServiceResponse_JsonErrorDetails
     */
    PropertyId[PropertyId["SpeechServiceResponse_JsonErrorDetails"] = 16] = "SpeechServiceResponse_JsonErrorDetails";
    /**
     * The cancellation reason. Currently unused.
     * @member PropertyId.CancellationDetails_Reason
     */
    PropertyId[PropertyId["CancellationDetails_Reason"] = 17] = "CancellationDetails_Reason";
    /**
     * The cancellation text. Currently unused.
     * @member PropertyId.CancellationDetails_ReasonText
     */
    PropertyId[PropertyId["CancellationDetails_ReasonText"] = 18] = "CancellationDetails_ReasonText";
    /**
     * The Cancellation detailed text. Currently unused.
     * @member PropertyId.CancellationDetails_ReasonDetailedText
     */
    PropertyId[PropertyId["CancellationDetails_ReasonDetailedText"] = 19] = "CancellationDetails_ReasonDetailedText";
    /**
     * The Language Understanding Service response output (in JSON format). Available via @see IntentRecognitionResult.Properties.
     * @member PropertyId.LanguageUnderstandingServiceResponse_JsonResult
     */
    PropertyId[PropertyId["LanguageUnderstandingServiceResponse_JsonResult"] = 20] = "LanguageUnderstandingServiceResponse_JsonResult";
})(PropertyId = exports.PropertyId || (exports.PropertyId = {}));



/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(2);
var Exports_2 = __webpack_require__(1);
var Contracts_1 = __webpack_require__(4);
var Exports_3 = __webpack_require__(0);
/**
 * Defines the base class Recognizer which mainly contains common event handlers.
 * @class Recognizer
 */
var Recognizer = /** @class */ (function () {
    /**
     * Creates and initializes an instance of a Recognizer
     * @constructor
     * @param {AudioConfig} audioInput - An optional audio input stream associated with the recognizer
     */
    function Recognizer(audioConfig) {
        this.audioConfig = (audioConfig !== undefined) ? audioConfig : Exports_3.AudioConfig.fromDefaultMicrophoneInput();
        this.privDisposed = false;
    }
    /**
     * Dispose of associated resources.
     * @member Recognizer.prototype.close
     * @function
     * @public
     */
    Recognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposed);
        this.dispose(true);
    };
    /**
     * This method performs cleanup of resources.
     * The Boolean parameter disposing indicates whether the method is called
     * from Dispose (if disposing is true) or from the finalizer (if disposing is false).
     * Derived classes should override this method to dispose resource if needed.
     * @member Recognizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - Flag to request disposal.
     */
    Recognizer.prototype.dispose = function (disposing) {
        if (this.privDisposed) {
            return;
        }
        if (disposing) {
            // disconnect
        }
        this.privDisposed = true;
    };
    Object.defineProperty(Recognizer, "telemetryEnabled", {
        /**
         * This method returns the current state of the telemetry setting.
         * @member Recognizer.prototype.telemetryEnabled
         * @function
         * @public
         * @returns true if the telemetry is enabled, false otherwise.
         */
        get: function () {
            return Exports_1.ServiceRecognizerBase.telemetryDataEnabled;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * This method globally enables or disables telemetry.
     * @member Recognizer.prototype.enableTelemetry
     * @function
     * @public
     * @param enabled - Global setting for telemetry collection.
     * If set to true, telemetry information like microphone errors,
     * recognition errors are collected and sent to Microsoft.
     * If set to false, no telemetry is sent to Microsoft.
     */
    /* tslint:disable:member-ordering */
    Recognizer.enableTelemetry = function (enabled) {
        Exports_1.ServiceRecognizerBase.telemetryDataEnabled = enabled;
    };
    // Setup the recognizer
    Recognizer.prototype.implRecognizerSetup = function (recognitionMode, speechProperties, audioConfig, speechConnectionFactory) {
        var osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        var osName = "unknown";
        var osVersion = "unknown";
        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }
        var recognizerConfig = this.createRecognizerConfig(new Exports_1.PlatformConfig(new Exports_1.Context(new Exports_1.OS(osPlatform, osName, osVersion))), recognitionMode); // SDK.SpeechResultFormat.Simple (Options - Simple/Detailed)
        var subscriptionKey = speechProperties.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Key, undefined);
        var authentication = subscriptionKey ?
            new Exports_1.CognitiveSubscriptionKeyAuthentication(subscriptionKey) :
            new Exports_1.CognitiveTokenAuthentication(function (authFetchEventId) {
                var authorizationToken = speechProperties.getProperty(Exports_3.PropertyId.SpeechServiceAuthorization_Token, undefined);
                return Exports_2.PromiseHelper.fromResult(authorizationToken);
            }, function (authFetchEventId) {
                var authorizationToken = speechProperties.getProperty(Exports_3.PropertyId.SpeechServiceAuthorization_Token, undefined);
                return Exports_2.PromiseHelper.fromResult(authorizationToken);
            });
        return this.createServiceRecognizer(authentication, speechConnectionFactory, audioConfig, recognizerConfig);
    };
    // Start the recognition
    Recognizer.prototype.implRecognizerStart = function (recognizer, successCallback, errorCallback, speechContext) {
        recognizer.recognize(speechContext, successCallback, errorCallback).on(
        /* tslint:disable:no-empty */
        function (result) { }, function (error) {
            if (!!errorCallback) {
                // Internal error with service communication.
                errorCallback("Runtime error: " + error);
            }
        });
    };
    return Recognizer;
}());
exports.Recognizer = Recognizer;



/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(2);
var SpeechConnectionFactory_1 = __webpack_require__(20);
var Contracts_1 = __webpack_require__(4);
var Exports_2 = __webpack_require__(0);
/**
 * Performs speech recognition from microphone, file, or other audio input streams, and gets transcribed text as result.
 * @class SpeechRecognizer
 */
var SpeechRecognizer = /** @class */ (function (_super) {
    __extends(SpeechRecognizer, _super);
    /**
     * SpeechRecognizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this recognizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    function SpeechRecognizer(speechConfig, audioConfig) {
        var _this = _super.call(this, audioConfig) || this;
        _this.privDisposedSpeechRecognizer = false;
        var speechConfigImpl = speechConfig;
        Contracts_1.Contracts.throwIfNull(speechConfigImpl, "speechConfig");
        _this.privProperties = speechConfigImpl.properties.clone();
        Contracts_1.Contracts.throwIfNullOrWhitespace(speechConfigImpl.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage]);
        return _this;
    }
    Object.defineProperty(SpeechRecognizer.prototype, "endpointId", {
        /**
         * Gets the endpoint id of a customized speech model that is used for speech recognition.
         * @member SpeechRecognizer.prototype.endpointId
         * @function
         * @public
         * @returns {string} the endpoint id of a customized speech model that is used for speech recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId, "00000000-0000-0000-0000-000000000000");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "authorizationToken", {
        /**
         * Gets the authorization token used to communicate with the service.
         * @member SpeechRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @returns {string} Authorization token.
         */
        get: function () {
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        /**
         * Sets the authorization token used to communicate with the service.
         * @member SpeechRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @param {string} token - Authorization token.
         */
        set: function (token) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(token, "token");
            this.properties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, token);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "speechRecognitionLanguage", {
        /**
         * Gets the spoken language of recognition.
         * @member SpeechRecognizer.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @returns {string} The spoken language of recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "outputFormat", {
        /**
         * Gets the output format of recognition.
         * @member SpeechRecognizer.prototype.outputFormat
         * @function
         * @public
         * @returns {OutputFormat} The output format of recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            if (this.properties.getProperty(Exports_1.OutputFormatPropertyName, Exports_2.OutputFormat[Exports_2.OutputFormat.Simple]) === Exports_2.OutputFormat[Exports_2.OutputFormat.Simple]) {
                return Exports_2.OutputFormat.Simple;
            }
            else {
                return Exports_2.OutputFormat.Detailed;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "properties", {
        /**
         * The collection of properties and their values defined for this SpeechRecognizer.
         * @member SpeechRecognizer.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The collection of properties and their values defined for this SpeechRecognizer.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts speech recognition, and stops after the first utterance is recognized.
     * The task returns the recognition text as result.
     * Note: RecognizeOnceAsync() returns when the first utterance has been recognized,
     *       so it is suitable only for single shot recognition
     *       like command or query. For long-running recognition, use StartContinuousRecognitionAsync() instead.
     * @member SpeechRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the SpeechRecognitionResult.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.recognizeOnceAsync = function (cb, err) {
        var _this = this;
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Interactive, this.properties, this.audioConfig, new SpeechConnectionFactory_1.SpeechConnectionFactory());
            this.implRecognizerStart(this.privReco, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!cb) {
                    cb(e);
                }
            }, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!err) {
                    err(e);
                }
            });
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Starts speech recognition, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * @member SpeechRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.startContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new SpeechConnectionFactory_1.SpeechConnectionFactory());
            this.implRecognizerStart(this.privReco, undefined, undefined);
            // report result to promise.
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
                cb = undefined;
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Stops continuous speech recognition.
     * @member SpeechRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.stopContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            this.implCloseExistingRecognizer();
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Starts speech recognition with keyword spotting, until
     * stopKeywordRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * Note: Key word spotting functionality is only available on the
     *      Speech Devices SDK. This functionality is currently not included in the SDK itself.
     * @member SpeechRecognizer.prototype.startKeywordRecognitionAsync
     * @function
     * @public
     * @param {KeywordRecognitionModel} model The keyword recognition model that
     *        specifies the keyword to be recognized.
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.startKeywordRecognitionAsync = function (model, cb, err) {
        Contracts_1.Contracts.throwIfNull(model, "model");
        if (!!err) {
            err("Not yet implemented.");
        }
    };
    /**
     * Stops continuous speech recognition.
     * Note: Key word spotting functionality is only available on the
     *       Speech Devices SDK. This functionality is currently not included in the SDK itself.
     * @member SpeechRecognizer.prototype.stopKeywordRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.stopKeywordRecognitionAsync = function (cb, err) {
        if (!!cb) {
            cb();
        }
    };
    /**
     * closes all external resources held by an instance of this class.
     * @member SpeechRecognizer.prototype.close
     * @function
     * @public
     */
    SpeechRecognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
        this.dispose(true);
    };
    /**
     * Disposes any resources held by the object.
     * @member SpeechRecognizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - true if disposing the object.
     */
    SpeechRecognizer.prototype.dispose = function (disposing) {
        if (this.privDisposedSpeechRecognizer) {
            return;
        }
        if (disposing) {
            this.implCloseExistingRecognizer();
            this.privDisposedSpeechRecognizer = true;
        }
        _super.prototype.dispose.call(this, disposing);
    };
    SpeechRecognizer.prototype.createRecognizerConfig = function (speechConfig, recognitionMode) {
        return new Exports_1.RecognizerConfig(speechConfig, recognitionMode, this.properties);
    };
    SpeechRecognizer.prototype.createServiceRecognizer = function (authentication, connectionFactory, audioConfig, recognizerConfig) {
        var configImpl = audioConfig;
        return new Exports_1.SpeechServiceRecognizer(authentication, connectionFactory, configImpl, recognizerConfig, this);
    };
    SpeechRecognizer.prototype.implCloseExistingRecognizer = function () {
        if (this.privReco) {
            this.privReco.audioSource.turnOff();
            this.privReco.dispose();
            this.privReco = undefined;
        }
    };
    return SpeechRecognizer;
}(Exports_2.Recognizer));
exports.SpeechRecognizer = SpeechRecognizer;



/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(2);
var Contracts_1 = __webpack_require__(4);
var Exports_2 = __webpack_require__(0);
/**
 * Intent recognizer.
 * @class
 */
var IntentRecognizer = /** @class */ (function (_super) {
    __extends(IntentRecognizer, _super);
    /**
     * Initializes an instance of the IntentRecognizer.
     * @constructor
     * @param {SpeechConfig} speechConfig - The set of configuration properties.
     * @param {AudioConfig} audioConfig - An optional audio input config associated with the recognizer
     */
    function IntentRecognizer(speechConfig, audioConfig) {
        var _this = this;
        Contracts_1.Contracts.throwIfNullOrUndefined(speechConfig, "speechConfig");
        var configImpl = speechConfig;
        Contracts_1.Contracts.throwIfNullOrUndefined(configImpl, "speechConfig");
        _this = _super.call(this, audioConfig) || this;
        _this.privIntentDataSent = false;
        _this.privAddedIntents = [];
        _this.privAddedLmIntents = {};
        _this.privDisposedIntentRecognizer = false;
        _this.privProperties = configImpl.properties;
        Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage]);
        return _this;
    }
    Object.defineProperty(IntentRecognizer.prototype, "speechRecognitionLanguage", {
        /**
         * Gets the spoken language of recognition.
         * @member IntentRecognizer.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @returns {string} the spoken language of recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IntentRecognizer.prototype, "authorizationToken", {
        /**
         * Gets the authorization token used to communicate with the service.
         * @member IntentRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @returns {string} Authorization token.
         */
        get: function () {
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        /**
         * Sets the authorization token used to communicate with the service.
         * Note: Please use a token derived from your LanguageUnderstanding subscription key for the Intent recognizer.
         * @member IntentRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @param {string} value - Authorization token.
         */
        set: function (value) {
            this.properties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IntentRecognizer.prototype, "properties", {
        /**
         * The collection of properties and their values defined for this IntentRecognizer.
         * @member IntentRecognizer.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The collection of properties and their
         *          values defined for this IntentRecognizer.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts intent recognition, and stops after the first utterance is recognized.
     * The task returns the recognition text and intent as result.
     * Note: RecognizeOnceAsync() returns when the first utterance has been recognized,
     *       so it is suitable only for single shot recognition like command or query.
     *       For long-running recognition, use StartContinuousRecognitionAsync() instead.
     * @member IntentRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the recognition has finished with an IntentRecognitionResult.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.recognizeOnceAsync = function (cb, err) {
        var _this = this;
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
            this.implCloseExistingRecognizer();
            var contextJson = void 0;
            if (Object.keys(this.privAddedLmIntents).length !== 0 || undefined !== this.privUmbrellaIntent) {
                contextJson = this.buildSpeechContext();
                this.privIntentDataSent = true;
            }
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Interactive, this.properties, this.audioConfig, new Exports_1.IntentConnectionFactory());
            var intentReco = this.privReco;
            intentReco.setIntents(this.privAddedLmIntents, this.privUmbrellaIntent);
            this.implRecognizerStart(this.privReco, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!cb) {
                    cb(e);
                }
            }, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!err) {
                    err(e);
                }
            }, contextJson);
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Starts speech recognition, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * @member IntentRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.startContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
            this.implCloseExistingRecognizer();
            var contextJson = void 0;
            if (Object.keys(this.privAddedLmIntents).length !== 0) {
                contextJson = this.buildSpeechContext();
                this.privIntentDataSent = true;
            }
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new Exports_1.IntentConnectionFactory());
            var intentReco = this.privReco;
            intentReco.setIntents(this.privAddedLmIntents, this.privUmbrellaIntent);
            this.implRecognizerStart(this.privReco, undefined, undefined, contextJson);
            // report result to promise.
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
                cb = undefined;
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Stops continuous intent recognition.
     * @member IntentRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.stopContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
            this.implCloseExistingRecognizer();
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Starts speech recognition with keyword spotting, until stopKeywordRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * Note: Key word spotting functionality is only available on the Speech Devices SDK.
     *       This functionality is currently not included in the SDK itself.
     * @member IntentRecognizer.prototype.startKeywordRecognitionAsync
     * @function
     * @public
     * @param {KeywordRecognitionModel} model - The keyword recognition model that specifies the keyword to be recognized.
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.startKeywordRecognitionAsync = function (model, cb, err) {
        Contracts_1.Contracts.throwIfNull(model, "model");
        if (!!err) {
            err("Not yet implemented.");
        }
    };
    /**
     * Stops continuous speech recognition.
     * Note: Key word spotting functionality is only available on the Speech Devices SDK.
     *       This functionality is currently not included in the SDK itself.
     * @member IntentRecognizer.prototype.stopKeywordRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.stopKeywordRecognitionAsync = function (cb, err) {
        if (!!cb) {
            cb();
        }
    };
    /**
     * Adds a phrase that should be recognized as intent.
     * @member IntentRecognizer.prototype.addIntent
     * @function
     * @public
     * @param {string} intentId - A String that represents the identifier of the intent to be recognized.
     * @param {string} phrase - A String that specifies the phrase representing the intent.
     */
    IntentRecognizer.prototype.addIntent = function (simplePhrase, intentId) {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        Contracts_1.Contracts.throwIfNullOrWhitespace(intentId, "intentId");
        Contracts_1.Contracts.throwIfNullOrWhitespace(simplePhrase, "simplePhrase");
        this.privAddedIntents.push([intentId, simplePhrase]);
    };
    /**
     * Adds an intent from Language Understanding service for recognition.
     * @member IntentRecognizer.prototype.addIntentWithLanguageModel
     * @function
     * @public
     * @param {string} intentId - A String that represents the identifier of the intent
     *        to be recognized. Ignored if intentName is empty.
     * @param {string} model - The intent model from Language Understanding service.
     * @param {string} intentName - The intent name defined in the intent model. If it
     *        is empty, all intent names defined in the model will be added.
     */
    IntentRecognizer.prototype.addIntentWithLanguageModel = function (intentId, model, intentName) {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        Contracts_1.Contracts.throwIfNullOrWhitespace(intentId, "intentId");
        Contracts_1.Contracts.throwIfNull(model, "model");
        var modelImpl = model;
        Contracts_1.Contracts.throwIfNullOrWhitespace(modelImpl.appId, "model.appId");
        this.privAddedLmIntents[intentId] = new Exports_1.AddedLmIntent(modelImpl, intentName);
    };
    /**
     * @summary Adds all intents from the specified Language Understanding Model.
     * @member IntentRecognizer.prototype.addAllIntents
     * @function
     * @public
     * @function
     * @public
     * @param {LanguageUnderstandingModel} model - The language understanding model containing the intents.
     * @param {string} intentId - A custom id String to be returned in the IntentRecognitionResult's getIntentId() method.
     */
    IntentRecognizer.prototype.addAllIntents = function (model, intentId) {
        Contracts_1.Contracts.throwIfNull(model, "model");
        var modelImpl = model;
        Contracts_1.Contracts.throwIfNullOrWhitespace(modelImpl.appId, "model.appId");
        this.privUmbrellaIntent = new Exports_1.AddedLmIntent(modelImpl, intentId);
    };
    /**
     * closes all external resources held by an instance of this class.
     * @member IntentRecognizer.prototype.close
     * @function
     * @public
     */
    IntentRecognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        this.dispose(true);
    };
    IntentRecognizer.prototype.createRecognizerConfig = function (speecgConfig, recognitionMode) {
        return new Exports_1.RecognizerConfig(speecgConfig, recognitionMode, this.properties);
    };
    IntentRecognizer.prototype.createServiceRecognizer = function (authentication, connectionFactory, audioConfig, recognizerConfig) {
        var audioImpl = audioConfig;
        return new Exports_1.IntentServiceRecognizer(authentication, connectionFactory, audioImpl, recognizerConfig, this, this.privIntentDataSent);
    };
    IntentRecognizer.prototype.dispose = function (disposing) {
        if (this.privDisposedIntentRecognizer) {
            return;
        }
        if (disposing) {
            this.privDisposedIntentRecognizer = true;
            _super.prototype.dispose.call(this, disposing);
        }
    };
    IntentRecognizer.prototype.implCloseExistingRecognizer = function () {
        if (this.privReco) {
            this.privReco.audioSource.turnOff();
            this.privReco.dispose();
            this.privReco = undefined;
        }
    };
    IntentRecognizer.prototype.buildSpeechContext = function () {
        var appId;
        var region;
        var subscriptionKey;
        var refGrammers = [];
        if (undefined !== this.privUmbrellaIntent) {
            appId = this.privUmbrellaIntent.modelImpl.appId;
            region = this.privUmbrellaIntent.modelImpl.region;
            subscriptionKey = this.privUmbrellaIntent.modelImpl.subscriptionKey;
        }
        // Build the reference grammer array.
        for (var _i = 0, _a = Object.keys(this.privAddedLmIntents); _i < _a.length; _i++) {
            var intentId = _a[_i];
            var addedLmIntent = this.privAddedLmIntents[intentId];
            // validate all the same model, region, and key...
            if (appId === undefined) {
                appId = addedLmIntent.modelImpl.appId;
            }
            else {
                if (appId !== addedLmIntent.modelImpl.appId) {
                    throw new Error("Intents must all be from the same LUIS model");
                }
            }
            if (region === undefined) {
                region = addedLmIntent.modelImpl.region;
            }
            else {
                if (region !== addedLmIntent.modelImpl.region) {
                    throw new Error("Intents must all be from the same LUIS model in a single region");
                }
            }
            if (subscriptionKey === undefined) {
                subscriptionKey = addedLmIntent.modelImpl.subscriptionKey;
            }
            else {
                if (subscriptionKey !== addedLmIntent.modelImpl.subscriptionKey) {
                    throw new Error("Intents must all use the same subscription key");
                }
            }
            var grammer = "luis/" + appId + "-PRODUCTION#" + intentId;
            refGrammers.push(grammer);
        }
        return JSON.stringify({
            dgi: {
                ReferenceGrammars: (undefined === this.privUmbrellaIntent) ? refGrammers : ["luis/" + appId + "-PRODUCTION"],
            },
            intent: {
                id: appId,
                key: (subscriptionKey === undefined) ? this.privProperties.getProperty(Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_Key]) : subscriptionKey,
                provider: "LUIS",
            },
        });
    };
    return IntentRecognizer;
}(Exports_2.Recognizer));
exports.IntentRecognizer = IntentRecognizer;



/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(2);
var Contracts_1 = __webpack_require__(4);
var Exports_2 = __webpack_require__(0);
/**
 * Translation recognizer
 * @class TranslationRecognizer
 */
var TranslationRecognizer = /** @class */ (function (_super) {
    __extends(TranslationRecognizer, _super);
    /**
     * Initializes an instance of the TranslationRecognizer.
     * @constructor
     * @param {SpeechTranslationConfig} speechConfig - Set of properties to configure this recognizer.
     * @param {AudioConfig} audioConfig - An optional audio config associated with the recognizer
     */
    function TranslationRecognizer(speechConfig, audioConfig) {
        var _this = this;
        var configImpl = speechConfig;
        Contracts_1.Contracts.throwIfNull(configImpl, "speechConfig");
        _this = _super.call(this, audioConfig) || this;
        _this.privDisposedTranslationRecognizer = false;
        _this.privProperties = configImpl.properties.clone();
        if (_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice, undefined) !== undefined) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice]);
        }
        Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages]);
        Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage]);
        return _this;
    }
    Object.defineProperty(TranslationRecognizer.prototype, "speechRecognitionLanguage", {
        /**
         * Gets the language name that was set when the recognizer was created.
         * @member TranslationRecognizer.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @returns {string} Gets the language name that was set when the recognizer was created.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "targetLanguages", {
        /**
         * Gets target languages for translation that were set when the recognizer was created.
         * The language is specified in BCP-47 format. The translation will provide translated text for each of language.
         * @member TranslationRecognizer.prototype.targetLanguages
         * @function
         * @public
         * @returns {string[]} Gets target languages for translation that were set when the recognizer was created.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "voiceName", {
        /**
         * Gets the name of output voice.
         * @member TranslationRecognizer.prototype.voiceName
         * @function
         * @public
         * @returns {string} the name of output voice.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice, undefined);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "authorizationToken", {
        /**
         * Gets the authorization token used to communicate with the service.
         * @member TranslationRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @returns {string} Authorization token.
         */
        get: function () {
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        /**
         * Sets the authorization token used to communicate with the service.
         * @member TranslationRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @param {string} value - Authorization token.
         */
        set: function (value) {
            this.properties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "properties", {
        /**
         * The collection of properties and their values defined for this TranslationRecognizer.
         * @member TranslationRecognizer.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The collection of properties and their values defined for this TranslationRecognizer.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts recognition and translation, and stops after the first utterance is recognized.
     * The task returns the translation text as result.
     * Note: recognizeOnceAsync returns when the first utterance has been recognized, so it is suitableonly
     *       for single shot recognition like command or query. For long-running recognition,
     *       use startContinuousRecognitionAsync() instead.
     * @member TranslationRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the result when the translation has completed.
     * @param err - Callback invoked in case of an error.
     */
    TranslationRecognizer.prototype.recognizeOnceAsync = function (cb, err) {
        var _this = this;
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new Exports_1.TranslationConnectionFactory());
            this.implRecognizerStart(this.privReco, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!cb) {
                    cb(e);
                }
            }, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!err) {
                    err(e);
                }
            });
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Starts recognition and translation, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive translation results.
     * @member TranslationRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has started.
     * @param err - Callback invoked in case of an error.
     */
    TranslationRecognizer.prototype.startContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new Exports_1.TranslationConnectionFactory());
            this.implRecognizerStart(this.privReco, undefined, undefined);
            // report result to promise.
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
                cb = undefined;
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Stops continuous recognition and translation.
     * @member TranslationRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has stopped.
     * @param err - Callback invoked in case of an error.
     */
    TranslationRecognizer.prototype.stopContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            this.implCloseExistingRecognizer();
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * closes all external resources held by an instance of this class.
     * @member TranslationRecognizer.prototype.close
     * @function
     * @public
     */
    TranslationRecognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
        this.dispose(true);
    };
    TranslationRecognizer.prototype.dispose = function (disposing) {
        if (this.privDisposedTranslationRecognizer) {
            return;
        }
        if (disposing) {
            this.implCloseExistingRecognizer();
            this.privDisposedTranslationRecognizer = true;
            _super.prototype.dispose.call(this, disposing);
        }
    };
    TranslationRecognizer.prototype.createRecognizerConfig = function (speechConfig, recognitionMode) {
        return new Exports_1.RecognizerConfig(speechConfig, Exports_1.RecognitionMode.Conversation, this.properties);
    };
    TranslationRecognizer.prototype.createServiceRecognizer = function (authentication, connectionFactory, audioConfig, recognizerConfig) {
        var configImpl = audioConfig;
        return new Exports_1.TranslationServiceRecognizer(authentication, connectionFactory, configImpl, recognizerConfig, this);
    };
    TranslationRecognizer.prototype.implCloseExistingRecognizer = function () {
        if (this.privReco) {
            this.privReco.audioSource.turnOff();
            this.privReco.dispose();
            this.privReco = undefined;
        }
    };
    return TranslationRecognizer;
}(Exports_2.Recognizer));
exports.TranslationRecognizer = TranslationRecognizer;



/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(0);
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



/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines the possible reasons a recognition result might not be recognized.
 * @class NoMatchReason
 */
var NoMatchReason;
(function (NoMatchReason) {
    /**
     * Indicates that speech was detected, but not recognized.
     * @member NoMatchReason.NotRecognized
     */
    NoMatchReason[NoMatchReason["NotRecognized"] = 0] = "NotRecognized";
    /**
     * Indicates that the start of the audio stream contained only silence,
     * and the service timed out waiting for speech.
     * @member NoMatchReason.InitialSilenceTimeout
     */
    NoMatchReason[NoMatchReason["InitialSilenceTimeout"] = 1] = "InitialSilenceTimeout";
    /**
     * Indicates that the start of the audio stream contained only noise,
     * and the service timed out waiting for speech.
     * @member NoMatchReason.InitialBabbleTimeout
     */
    NoMatchReason[NoMatchReason["InitialBabbleTimeout"] = 2] = "InitialBabbleTimeout";
})(NoMatchReason = exports.NoMatchReason || (exports.NoMatchReason = {}));



/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(2);
var Exports_2 = __webpack_require__(0);
/**
 * Contains detailed information for NoMatch recognition results.
 * @class NoMatchDetails
 */
var NoMatchDetails = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {NoMatchReason} reason - The no-match reason.
     */
    function NoMatchDetails(reason) {
        this.privReason = reason;
    }
    /**
     * Creates an instance of NoMatchDetails object for the NoMatch SpeechRecognitionResults.
     * @member NoMatchDetails.fromResult
     * @function
     * @public
     * @param {SpeechRecognitionResult | IntentRecognitionResult | TranslationRecognitionResult}
     *        result - The recognition result that was not recognized.
     * @returns {NoMatchDetails} The no match details object being created.
     */
    NoMatchDetails.fromResult = function (result) {
        var simpleSpeech = Exports_1.SimpleSpeechPhrase.fromJSON(result.json);
        var reason = Exports_2.NoMatchReason.NotRecognized;
        switch (simpleSpeech.RecognitionStatus) {
            case Exports_1.RecognitionStatus.BabbleTimeout:
                reason = Exports_2.NoMatchReason.InitialBabbleTimeout;
                break;
            case Exports_1.RecognitionStatus.InitialSilenceTimeout:
                reason = Exports_2.NoMatchReason.InitialSilenceTimeout;
                break;
            default:
                reason = Exports_2.NoMatchReason.NotRecognized;
                break;
        }
        return new NoMatchDetails(reason);
    };
    Object.defineProperty(NoMatchDetails.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member NoMatchDetails.prototype.reason
         * @function
         * @public
         * @returns {NoMatchReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    return NoMatchDetails;
}());
exports.NoMatchDetails = NoMatchDetails;



/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Define payload of speech recognition canceled result events.
 * @class TranslationRecognitionCanceledEventArgs
 */
var TranslationRecognitionCanceledEventArgs = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} sessionid - The session id.
     * @param {CancellationReason} cancellationReason - The cancellation reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {TranslationRecognitionResult} result - The result.
     */
    function TranslationRecognitionCanceledEventArgs(sessionid, cancellationReason, errorDetails, errorCode, result) {
        this.privCancelReason = cancellationReason;
        this.privErrorDetails = errorDetails;
        this.privResult = result;
        this.privSessionId = sessionid;
        this.privErrorCode = errorCode;
    }
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "result", {
        /**
         * Specifies the recognition result.
         * @member TranslationRecognitionCanceledEventArgs.prototype.result
         * @function
         * @public
         * @returns {TranslationRecognitionResult} the recognition result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "sessionId", {
        /**
         * Specifies the session identifier.
         * @member TranslationRecognitionCanceledEventArgs.prototype.sessionId
         * @function
         * @public
         * @returns {string} the session identifier.
         */
        get: function () {
            return this.privSessionId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member TranslationRecognitionCanceledEventArgs.prototype.reason
         * @function
         * @public
         * @returns {CancellationReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privCancelReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "errorCode", {
        /**
         * The error code in case of an unsuccessful recognition.
         * Added in version 1.1.0.
         * @return An error code that represents the error reason.
         */
        get: function () {
            return this.privErrorCode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member TranslationRecognitionCanceledEventArgs.prototype.errorDetails
         * @function
         * @public
         * @returns {string} A String that represents the error details.
         */
        get: function () {
            return this.privErrorDetails;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationRecognitionCanceledEventArgs;
}());
exports.TranslationRecognitionCanceledEventArgs = TranslationRecognitionCanceledEventArgs;



/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

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
var Exports_1 = __webpack_require__(0);
/**
 * Define payload of intent recognition canceled result events.
 * @class IntentRecognitionCanceledEventArgs
 */
var IntentRecognitionCanceledEventArgs = /** @class */ (function (_super) {
    __extends(IntentRecognitionCanceledEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} result - The result of the intent recognition.
     * @param {string} offset - The offset.
     * @param {IntentRecognitionResult} sessionId - The session id.
     */
    function IntentRecognitionCanceledEventArgs(reason, errorDetails, errorCode, result, offset, sessionId) {
        var _this = _super.call(this, result, offset, sessionId) || this;
        _this.privReason = reason;
        _this.privErrorDetails = errorDetails;
        _this.privErrorCode = errorCode;
        return _this;
    }
    Object.defineProperty(IntentRecognitionCanceledEventArgs.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member IntentRecognitionCanceledEventArgs.prototype.reason
         * @function
         * @public
         * @returns {CancellationReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IntentRecognitionCanceledEventArgs.prototype, "errorCode", {
        /**
         * The error code in case of an unsuccessful recognition.
         * Added in version 1.1.0.
         * @return An error code that represents the error reason.
         */
        get: function () {
            return this.privErrorCode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IntentRecognitionCanceledEventArgs.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member IntentRecognitionCanceledEventArgs.prototype.errorDetails
         * @function
         * @public
         * @returns {string} A String that represents the error details.
         */
        get: function () {
            return this.privErrorDetails;
        },
        enumerable: true,
        configurable: true
    });
    return IntentRecognitionCanceledEventArgs;
}(Exports_1.IntentRecognitionEventArgs));
exports.IntentRecognitionCanceledEventArgs = IntentRecognitionCanceledEventArgs;



/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = __webpack_require__(2);
var Exports_2 = __webpack_require__(0);
/**
 * Contains detailed information about why a result was canceled.
 * @class CancellationDetails
 */
var CancellationDetails = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - The error details, if provided.
     */
    function CancellationDetails(reason, errorDetails, errorCode) {
        this.privReason = reason;
        this.privErrorDetails = errorDetails;
        this.privErrorCode = errorCode;
    }
    /**
     * Creates an instance of CancellationDetails object for the canceled RecognitionResult.
     * @member CancellationDetails.fromResult
     * @function
     * @public
     * @param {RecognitionResult} result - The result that was canceled.
     * @returns {CancellationDetails} The cancellation details object being created.
     */
    CancellationDetails.fromResult = function (result) {
        var reason = Exports_2.CancellationReason.Error;
        var errorCode = Exports_2.CancellationErrorCode.NoError;
        if (!!result.json) {
            var simpleSpeech = Exports_1.SimpleSpeechPhrase.fromJSON(result.json);
            reason = Exports_1.EnumTranslation.implTranslateCancelResult(simpleSpeech.RecognitionStatus);
        }
        if (!!result.properties) {
            errorCode = Exports_2.CancellationErrorCode[result.properties.getProperty(Exports_1.CancellationErrorCodePropertyName, Exports_2.CancellationErrorCode[Exports_2.CancellationErrorCode.NoError])];
        }
        return new CancellationDetails(reason, result.errorDetails, errorCode);
    };
    Object.defineProperty(CancellationDetails.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member CancellationDetails.prototype.reason
         * @function
         * @public
         * @returns {CancellationReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CancellationDetails.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member CancellationDetails.prototype.errorDetails
         * @function
         * @public
         * @returns {string} A String that represents the error details.
         */
        get: function () {
            return this.privErrorDetails;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CancellationDetails.prototype, "ErrorCode", {
        /**
         * The error code in case of an unsuccessful recognition.
         * Added in version 1.1.0.
         * @return An error code that represents the error reason.
         */
        get: function () {
            return this.privErrorCode;
        },
        enumerable: true,
        configurable: true
    });
    return CancellationDetails;
}());
exports.CancellationDetails = CancellationDetails;



/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *  Defines error code in case that CancellationReason is Error.
 *  Added in version 1.1.0.
 */
var CancellationErrorCode;
(function (CancellationErrorCode) {
    /**
     * Indicates that no error occurred during speech recognition.
     */
    CancellationErrorCode[CancellationErrorCode["NoError"] = 0] = "NoError";
    /**
     * Indicates an authentication error.
     */
    CancellationErrorCode[CancellationErrorCode["AuthenticationFailure"] = 1] = "AuthenticationFailure";
    /**
     * Indicates that one or more recognition parameters are invalid.
     */
    CancellationErrorCode[CancellationErrorCode["BadRequestParameters"] = 2] = "BadRequestParameters";
    /**
     * Indicates that the number of parallel requests exceeded the number of allowed
     * concurrent transcriptions for the subscription.
     */
    CancellationErrorCode[CancellationErrorCode["TooManyRequests"] = 3] = "TooManyRequests";
    /**
     * Indicates a connection error.
     */
    CancellationErrorCode[CancellationErrorCode["ConnectionFailure"] = 4] = "ConnectionFailure";
    /**
     * Indicates a time-out error when waiting for response from service.
     */
    CancellationErrorCode[CancellationErrorCode["ServiceTimeout"] = 5] = "ServiceTimeout";
    /**
     * Indicates that an error is returned by the service.
     */
    CancellationErrorCode[CancellationErrorCode["ServiceError"] = 6] = "ServiceError";
    /**
     * Indicates an unexpected runtime error.
     */
    CancellationErrorCode[CancellationErrorCode["RuntimeError"] = 7] = "RuntimeError";
})(CancellationErrorCode = exports.CancellationErrorCode || (exports.CancellationErrorCode = {}));



/***/ })
/******/ ]);
//# sourceMappingURL=microsoft.cognitiveservices.speech.sdk.bundle.js.map