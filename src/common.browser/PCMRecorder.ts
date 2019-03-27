// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { RiffPcmEncoder, Stream } from "../common/Exports";
import { IRecorder } from "./IRecorder";

export class PcmRecorder implements IRecorder {
    private privMediaResources: IMediaResources;
    private privSpeechProcessorScript: string; // speech-processor.js Url

    public record = (context: AudioContext, mediaStream: MediaStream, outputStream: Stream<ArrayBuffer>): void => {
        const desiredSampleRate = 16000;

        const scriptNode = (() => {
            let bufferSize = 0;
            try {
                return context.createScriptProcessor(bufferSize, 1, 1);
            } catch (error) {
                // Webkit (<= version 31) requires a valid bufferSize.
                bufferSize = 2048;
                let audioSampleRate = context.sampleRate;
                while (bufferSize < 16384 && audioSampleRate >= (2 * desiredSampleRate)) {
                    bufferSize <<= 1;
                    audioSampleRate >>= 1;
                }
                return context.createScriptProcessor(bufferSize, 1, 1);
            }
        })();

        const waveStreamEncoder = new RiffPcmEncoder(context.sampleRate, desiredSampleRate);
        let needHeader: boolean = true;
        const that = this;
        scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
            const inputFrame = event.inputBuffer.getChannelData(0);

            if (outputStream && !outputStream.isClosed) {
                const waveFrame = waveStreamEncoder.encode(needHeader, inputFrame);
                if (!!waveFrame) {
                    outputStream.writeStreamChunk({
                        buffer: waveFrame,
                        isEnd: false,
                        timeReceived: Date.now(),
                    });
                    needHeader = false;
                }
            }
        };

        const micInput = context.createMediaStreamSource(mediaStream);

        // https://webaudio.github.io/web-audio-api/#audioworklet
        // Using AudioWorklet to improve audio quality and avoid audio glitches due to blocking the UI thread

        if (!!this.privSpeechProcessorScript && !!context.audioWorklet) {
            context.audioWorklet
                .addModule(this.privSpeechProcessorScript)
                .then(() => {
                    const workletNode = new AudioWorkletNode(context, "speech-processor");
                    workletNode.port.onmessage = (ev: MessageEvent) => {
                        const inputFrame: Float32Array = ev.data as Float32Array;

                        if (outputStream && !outputStream.isClosed) {
                            const waveFrame = waveStreamEncoder.encode(needHeader, inputFrame);
                            if (!!waveFrame) {
                                outputStream.writeStreamChunk({
                                    buffer: waveFrame,
                                    isEnd: false,
                                    timeReceived: Date.now(),
                                });
                                needHeader = false;
                            }
                        }
                    };
                    micInput.connect(workletNode);
                    workletNode.connect(context.destination);
                    this.privMediaResources = {
                        scriptProcessorNode: workletNode,
                        source: micInput,
                        stream: mediaStream,
                    };
                })
                .catch(() => {
                    micInput.connect(scriptNode);
                    scriptNode.connect(context.destination);
                    this.privMediaResources = {
                        scriptProcessorNode: scriptNode,
                        source: micInput,
                        stream: mediaStream,
                    };
                });
        } else {
            micInput.connect(scriptNode);
            scriptNode.connect(context.destination);
            this.privMediaResources = {
                scriptProcessorNode: scriptNode,
                source: micInput,
                stream: mediaStream,
            };
        }
    }

    public releaseMediaResources = (context: AudioContext): void => {
        if (this.privMediaResources) {
            if (this.privMediaResources.scriptProcessorNode) {
                this.privMediaResources.scriptProcessorNode.disconnect(context.destination);
                this.privMediaResources.scriptProcessorNode = null;
            }
            if (this.privMediaResources.source) {
                this.privMediaResources.source.disconnect();
                this.privMediaResources.stream.getTracks().forEach((track: any) => track.stop());
                this.privMediaResources.source = null;
            }
        }
    }

    public setWorkletUrl(url: string): void {
        this.privSpeechProcessorScript = url;
    }
}

interface IMediaResources {
    source: MediaStreamAudioSourceNode;
    scriptProcessorNode: ScriptProcessorNode | AudioWorkletNode;
    stream: MediaStream;
}
