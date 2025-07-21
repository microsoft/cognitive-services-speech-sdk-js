// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    connectivity,
    ISpeechConfigAudioDevice,
    type
} from "../common.speech/Exports.js";
import {
    AudioSourceErrorEvent,
    AudioSourceEvent,
    AudioSourceInitializingEvent,
    AudioSourceOffEvent,
    AudioSourceReadyEvent,
    AudioStreamNodeAttachedEvent,
    AudioStreamNodeAttachingEvent,
    AudioStreamNodeDetachedEvent,
    AudioStreamNodeErrorEvent,
    ChunkedArrayBufferStream,
    createNoDashGuid,
    Deferred,
    Events,
    EventSource,
    IAudioSource,
    IAudioStreamNode,
    IStringDictionary,
    Stream,
} from "../common/Exports.js";
import { IStreamChunk } from "../common/Stream.js";
import {
    AudioStreamFormat,
    AudioStreamFormatImpl,
} from "../sdk/Audio/AudioStreamFormat.js";
import { IRecorder } from "./IRecorder.js";

type NavigatorUserMediaSuccessCallback = (stream: MediaStream) => void;
type NavigatorUserMediaErrorCallback = (error: DOMException) => void;

export const AudioWorkletSourceURLPropertyName = "MICROPHONE-WorkletSourceUrl";

export class MicAudioSource implements IAudioSource {

    private static readonly AUDIOFORMAT: AudioStreamFormatImpl = AudioStreamFormat.getDefaultInputFormat() as AudioStreamFormatImpl;

    private privStreams: IStringDictionary<Stream<ArrayBuffer>> = {};

    private privId: string;

    private privEvents: EventSource<AudioSourceEvent>;

    private privInitializeDeferral: Deferred<void>;

    private privMediaStream: MediaStream;

    private privContext: AudioContext;

    private privMicrophoneLabel: string;

    private privOutputChunkSize: number;

    private privIsClosing: boolean;

    public constructor(
        private readonly privRecorder: IRecorder,
        private readonly deviceId?: string,
        audioSourceId?: string,
        mediaStream?: MediaStream
        ) {

        this.privOutputChunkSize = MicAudioSource.AUDIOFORMAT.avgBytesPerSec / 10;
        this.privId = audioSourceId ? audioSourceId : createNoDashGuid();
        this.privEvents = new EventSource<AudioSourceEvent>();
        this.privMediaStream = mediaStream || null;
        this.privIsClosing = false;
    }

    public get format(): Promise<AudioStreamFormatImpl> {
        return Promise.resolve(MicAudioSource.AUDIOFORMAT);
    }

    public turnOn(): Promise<void> {
        if (this.privInitializeDeferral) {
            return this.privInitializeDeferral.promise;
        }

        this.privInitializeDeferral = new Deferred<void>();

        try {
            this.createAudioContext();
        } catch (error) {
            if (error instanceof Error) {
                const typedError: Error = error;
                this.privInitializeDeferral.reject(typedError.name + ": " + typedError.message);
            } else {
                this.privInitializeDeferral.reject(error as string);
            }
            return this.privInitializeDeferral.promise;
        }

        const nav = window.navigator as unknown as {
            webkitGetUserMedia?: (
                constraints: MediaStreamConstraints,
                successCallback: (stream: MediaStream) => void,
                errorCallback: (error: any) => void
            ) => void;
            mozGetUserMedia?: (
                constraints: MediaStreamConstraints,
                successCallback: (stream: MediaStream) => void,
                errorCallback: (error: any) => void
            ) => void;
            msGetUserMedia?: (
                constraints: MediaStreamConstraints,
                successCallback: (stream: MediaStream) => void,
                errorCallback: (error: any) => void
            ) => void;
            getUserMedia?: (
                constraints: MediaStreamConstraints,
                successCallback: (stream: MediaStream) => void,
                errorCallback: (error: any) => void
            ) => void;
            mediaDevices?: MediaDevices;
        };

        let getUserMedia = (
            // eslint-disable-next-line
            nav.getUserMedia ||
            nav.webkitGetUserMedia ||
            nav.mozGetUserMedia ||
            nav.msGetUserMedia
        );

        if (!!nav.mediaDevices) {
            getUserMedia = (constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void => {
                nav.mediaDevices
                    .getUserMedia(constraints)
                    .then(successCallback)
                    .catch(errorCallback);
            };
        }

        if (!getUserMedia) {
            const errorMsg = "Browser does not support getUserMedia.";
            this.privInitializeDeferral.reject(errorMsg);
            this.onEvent(new AudioSourceErrorEvent(errorMsg, "")); // mic initialized error - no streamid at this point
        } else {
            const next = (): void => {
                this.onEvent(new AudioSourceInitializingEvent(this.privId)); // no stream id
                if (this.privMediaStream && this.privMediaStream.active) {
                    this.onEvent(new AudioSourceReadyEvent(this.privId));
                    this.privInitializeDeferral.resolve();
                } else {
                    getUserMedia(
                        { audio: this.deviceId ? { deviceId: this.deviceId } : true, video: false },
                        (mediaStream: MediaStream): void => {
                            this.privMediaStream = mediaStream;
                            this.onEvent(new AudioSourceReadyEvent(this.privId));
                            this.privInitializeDeferral.resolve();
                        }, (error: any): void => {
                            const errorMsg = `Error occurred during microphone initialization: ${error as string}`;
                            this.privInitializeDeferral.reject(errorMsg);
                            this.onEvent(new AudioSourceErrorEvent(this.privId, errorMsg));
                        });
                }
            };

            if (this.privContext.state === "suspended") {
                // NOTE: On iOS, the Web Audio API requires sounds to be triggered from an explicit user action.
                // https://github.com/WebAudio/web-audio-api/issues/790
                this.privContext.resume()
                    .then(next)
                    .catch((reason: any): void => {
                        this.privInitializeDeferral.reject(`Failed to initialize audio context: ${reason as string}`);
                    });
            } else {
                next();
            }
        }

        return this.privInitializeDeferral.promise;
    }

    public id(): string {
        return this.privId;
    }

    public attach(audioNodeId: string): Promise<IAudioStreamNode> {
        this.onEvent(new AudioStreamNodeAttachingEvent(this.privId, audioNodeId));

        return this.listen(audioNodeId).then<IAudioStreamNode>(
            (stream: Stream<ArrayBuffer>): IAudioStreamNode => {
                this.onEvent(new AudioStreamNodeAttachedEvent(this.privId, audioNodeId));
                return {
                    detach: async (): Promise<void> => {
                        stream.readEnded();
                        delete this.privStreams[audioNodeId];
                        this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
                        return this.turnOff();
                    },
                    id: (): string => audioNodeId,
                    read: (): Promise<IStreamChunk<ArrayBuffer>> => stream.read(),
                };
            });
    }

    public detach(audioNodeId: string): void {
        if (audioNodeId && this.privStreams[audioNodeId]) {
            this.privStreams[audioNodeId].close();
            delete this.privStreams[audioNodeId];
            this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
        }
    }

    public async turnOff(): Promise<void> {
        for (const streamId in this.privStreams) {
            if (streamId) {
                const stream = this.privStreams[streamId];
                if (stream) {
                    stream.close();
                }
            }
        }

        this.onEvent(new AudioSourceOffEvent(this.privId)); // no stream now
        if (this.privInitializeDeferral) {
            // Correctly handle when browser forces mic off before turnOn() completes
            // eslint-disable-next-line @typescript-eslint/await-thenable
            await this.privInitializeDeferral;
            this.privInitializeDeferral = null;
        }

        await this.destroyAudioContext();

        return;
    }

    public get events(): EventSource<AudioSourceEvent> {
        return this.privEvents;
    }

    public get deviceInfo(): Promise<ISpeechConfigAudioDevice> {
        return this.getMicrophoneLabel().then((label: string): ISpeechConfigAudioDevice => (
            {
                bitspersample: MicAudioSource.AUDIOFORMAT.bitsPerSample,
                channelcount: MicAudioSource.AUDIOFORMAT.channels,
                connectivity: connectivity.Unknown,
                manufacturer: "Speech SDK",
                model: label,
                samplerate: MicAudioSource.AUDIOFORMAT.samplesPerSec,
                type: type.Microphones,
            }
        ));
    }

    public setProperty(name: string, value: string): void {
        if (name === AudioWorkletSourceURLPropertyName) {
            this.privRecorder.setWorkletUrl(value);
        } else {
            throw new Error("Property '" + name + "' is not supported on Microphone.");
        }
    }

    private getMicrophoneLabel(): Promise<string> {
        const defaultMicrophoneName: string = "microphone";

        // If we did this already, return the value.
        if (this.privMicrophoneLabel !== undefined) {
            return Promise.resolve(this.privMicrophoneLabel);
        }

        // If the stream isn't currently running, we can't query devices because security.
        if (this.privMediaStream === undefined || !this.privMediaStream.active) {
            return Promise.resolve(defaultMicrophoneName);
        }

        // Setup a default
        this.privMicrophoneLabel = defaultMicrophoneName;

        // Get the id of the device running the audio track.
        const microphoneDeviceId: string = this.privMediaStream.getTracks()[0].getSettings().deviceId;

        // If the browser doesn't support getting the device ID, set a default and return.
        if (undefined === microphoneDeviceId) {
            return Promise.resolve(this.privMicrophoneLabel);
        }

        const deferred: Deferred<string> = new Deferred<string>();

        // Enumerate the media devices.
        navigator.mediaDevices.enumerateDevices().then((devices: MediaDeviceInfo[]): void => {
            for (const device of devices) {
                if (device.deviceId === microphoneDeviceId) {
                    // Found the device
                    this.privMicrophoneLabel = device.label;
                    break;
                }
            }
            deferred.resolve(this.privMicrophoneLabel);
        }, (): Deferred<string> => deferred.resolve(this.privMicrophoneLabel));

        return deferred.promise;
    }

    private async listen(audioNodeId: string): Promise<Stream<ArrayBuffer>> {
        await this.turnOn();
        const stream = new ChunkedArrayBufferStream(this.privOutputChunkSize, audioNodeId);
        this.privStreams[audioNodeId] = stream;
        try {
            this.privRecorder.record(this.privContext, this.privMediaStream, stream);
        } catch (error) {
            this.onEvent(new AudioStreamNodeErrorEvent(this.privId, audioNodeId, error as string));
            throw error;
        }
        const result: Stream<ArrayBuffer> = stream;
        return result;
    }

    private onEvent(event: AudioSourceEvent): void {
        this.privEvents.onEvent(event);
        Events.instance.onEvent(event);
    }

    private createAudioContext(): void {
        if (!!this.privContext) {
            return;
        }

        this.privContext = AudioStreamFormatImpl.getAudioContext(MicAudioSource.AUDIOFORMAT.samplesPerSec);
    }

    private async destroyAudioContext(): Promise<void> {
        if (!this.privContext) {
            return;
        }

        this.privRecorder.releaseMediaResources(this.privContext);

        // This pattern brought to you by a bug in the TypeScript compiler where it
        // confuses the ("close" in this.privContext) with this.privContext always being null as the alternate.
        // https://github.com/Microsoft/TypeScript/issues/11498
        let hasClose: boolean = false;
        if ("close" in this.privContext) {
            hasClose = true;
        }

        if (hasClose) {
            if (!this.privIsClosing) {
                // The audio context close may take enough time that the close is called twice
                this.privIsClosing = true;
                await this.privContext.close();
                this.privContext = null;
                this.privIsClosing = false;
            }
        } else if (null !== this.privContext && this.privContext.state === "running") {
            // Suspend actually takes a callback, but analogous to the
            // resume method, it'll be only fired if suspend is called
            // in a direct response to a user action. The later is not always
            // the case, as TurnOff is also called, when we receive an
            // end-of-speech message from the service. So, doing a best effort
            // fire-and-forget here.
            await this.privContext.suspend();
        }
    }
}
