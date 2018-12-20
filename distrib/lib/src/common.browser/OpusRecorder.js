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

//# sourceMappingURL=OpusRecorder.js.map
