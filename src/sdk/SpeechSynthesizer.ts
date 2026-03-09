// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-empty-function */

import { PathLike } from "fs";
import { IRestResponse } from "../common.browser/RestMessageAdapter.js";
import {
    IAuthentication,
    ISynthesisConnectionFactory,
    SpeechSynthesisConnectionFactory,
    SynthesisAdapterBase,
    SpeechSynthesisAdapter,
    SynthesisRestAdapter,
    SynthesizerConfig,
} from "../common.speech/Exports.js";
import {
    createNoDashGuid,
    IAudioDestination,
    marshalPromiseToCallbacks,
} from "../common/Exports.js";
import { AudioOutputConfigImpl } from "./Audio/AudioConfig.js";
import { AudioFileWriter } from "./Audio/AudioFileWriter.js";
import { AudioOutputFormatImpl } from "./Audio/AudioOutputFormat.js";
import {
    PullAudioOutputStreamImpl,
    PushAudioOutputStreamImpl
} from "./Audio/AudioOutputStream.js";
import { Contracts } from "./Contracts.js";
import {
    AudioConfig,
    AudioOutputStream,
    AutoDetectSourceLanguageConfig,
    PropertyId,
    PullAudioOutputStream,
    PushAudioOutputStreamCallback,
    SpeechConfig,
    SpeechSynthesisBookmarkEventArgs,
    SpeechSynthesisEventArgs,
    SpeechSynthesisOutputFormat,
    SpeechSynthesisResult,
    SpeechSynthesisVisemeEventArgs,
    SpeechSynthesisWordBoundaryEventArgs,
    SynthesisVoicesResult,
    Synthesizer
} from "./Exports.js";
import { SpeechConfigImpl } from "./SpeechConfig.js";
import { SpeechSynthesisRequest } from "./SpeechSynthesisRequest.js";
import { StreamingSynthesisRequest, SynthesisRequest } from "./Synthesizer.js";

/**
 * Defines the class SpeechSynthesizer for text to speech.
 * Updated in version 1.16.0
 * @class SpeechSynthesizer
 */
export class SpeechSynthesizer extends Synthesizer {
    protected audioConfig: AudioConfig;

    /**
     * Defines event handler for synthesis start events.
     * @member SpeechSynthesizer.prototype.synthesisStarted
     * @function
     * @public
     */
    public synthesisStarted: (sender: SpeechSynthesizer, event: SpeechSynthesisEventArgs) => void;

    /**
     * Defines event handler for synthesizing events.
     * @member SpeechSynthesizer.prototype.synthesizing
     * @function
     * @public
     */
    public synthesizing: (sender: SpeechSynthesizer, event: SpeechSynthesisEventArgs) => void;

    /**
     * Defines event handler for synthesis completed events.
     * @member SpeechSynthesizer.prototype.synthesisCompleted
     * @function
     * @public
     */
    public synthesisCompleted: (sender: SpeechSynthesizer, event: SpeechSynthesisEventArgs) => void;

    /**
     * Defines event handler for synthesis cancelled events.
     * @member SpeechSynthesizer.prototype.SynthesisCanceled
     * @function
     * @public
     */
    public SynthesisCanceled: (sender: SpeechSynthesizer, event: SpeechSynthesisEventArgs) => void;

    /**
     * Defines event handler for word boundary events
     * @member SpeechSynthesizer.prototype.wordBoundary
     * @function
     * @public
     */
    public wordBoundary: (sender: SpeechSynthesizer, event: SpeechSynthesisWordBoundaryEventArgs) => void;

    /**
     * Defines event handler for bookmark reached events
     * Added in version 1.16.0
     * @member SpeechSynthesizer.prototype.bookmarkReached
     * @function
     * @public
     */
    public bookmarkReached: (sender: SpeechSynthesizer, event: SpeechSynthesisBookmarkEventArgs) => void;

    /**
     * Defines event handler for viseme received event
     * Added in version 1.16.0
     * @member SpeechSynthesizer.prototype.visemeReceived
     * @function
     * @public
     */
    public visemeReceived: (sender: SpeechSynthesizer, event: SpeechSynthesisVisemeEventArgs) => void;

    /**
     * SpeechSynthesizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this synthesizer.
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the synthesizer.
     */
    public constructor(speechConfig: SpeechConfig, audioConfig?: AudioConfig | null) {
        super(speechConfig);

        if (audioConfig !== null) {
            if (audioConfig === undefined) {
                this.audioConfig = (typeof window === "undefined") ? undefined : AudioConfig.fromDefaultSpeakerOutput();
            } else {
                this.audioConfig = audioConfig;
            }
        }

        this.privConnectionFactory = new SpeechSynthesisConnectionFactory();
        this.implCommonSynthesizeSetup();
    }

    /**
     * SpeechSynthesizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - an set of initial properties for this synthesizer
     * @param {AutoDetectSourceLanguageConfig} autoDetectSourceLanguageConfig - An source language detection configuration associated with the synthesizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the synthesizer
     */
    public static FromConfig(speechConfig: SpeechConfig, autoDetectSourceLanguageConfig: AutoDetectSourceLanguageConfig, audioConfig?: AudioConfig | null): SpeechSynthesizer {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        autoDetectSourceLanguageConfig.properties.mergeTo(speechConfigImpl.properties);
        return new SpeechSynthesizer(speechConfig, audioConfig);
    }

    /**
     * Executes speech synthesis on plain text.
     * The task returns the synthesis result.
     * @member SpeechSynthesizer.prototype.speakTextAsync
     * @function
     * @public
     * @param text - Text to be synthesized.
     * @param cb - Callback that received the SpeechSynthesisResult.
     * @param err - Callback invoked in case of an error.
     * @param stream - AudioOutputStream to receive the synthesized audio.
     */
    public speakTextAsync(text: string, cb?: (e: SpeechSynthesisResult) => void, err?: (e: string) => void, stream?: AudioOutputStream | PushAudioOutputStreamCallback | PathLike): void {
        this.speakImpl(text, false, cb, err, stream);
    }

    /**
     * Executes speech synthesis on SSML.
     * The task returns the synthesis result.
     * @member SpeechSynthesizer.prototype.speakSsmlAsync
     * @function
     * @public
     * @param ssml - SSML to be synthesized.
     * @param cb - Callback that received the SpeechSynthesisResult.
     * @param err - Callback invoked in case of an error.
     * @param stream - AudioOutputStream to receive the synthesized audio.
     */
    public speakSsmlAsync(ssml: string, cb?: (e: SpeechSynthesisResult) => void, err?: (e: string) => void, stream?: AudioOutputStream | PushAudioOutputStreamCallback | PathLike): void {
        this.speakImpl(ssml, true, cb, err, stream);
    }

    /**
     * Performs synthesis using a SpeechSynthesisRequest, which supports text streaming.
     * This method is in preview and may be subject to change in future versions.
     * @member SpeechSynthesizer.prototype.speakAsync
     * @function
     * @public
     * @param request - The speech synthesis request (supports text streaming input).
     * @param cb - Callback that received the SpeechSynthesisResult.
     * @param err - Callback invoked in case of an error.
     * @param stream - AudioOutputStream to receive the synthesized audio.
     */
    public speakAsync(
        request: SpeechSynthesisRequest,
        cb?: (e: SpeechSynthesisResult) => void,
        err?: (e: string) => void,
        stream?: AudioOutputStream | PushAudioOutputStreamCallback | PathLike
    ): void {
        try {
            Contracts.throwIfDisposed(this.privDisposed);
            const requestId = createNoDashGuid();
            const audioDestination = this.resolveAudioDestination(stream);
            const { onSuccess, onError } = this.createSynthesisCallbacks(cb, err, (): void => {
                /* eslint-disable no-empty */
                this.adapterSpeakStream().catch((): void => { });
            });

            this.streamingSynthesisRequestQueue.enqueue(new StreamingSynthesisRequest(
                requestId,
                request,
                onSuccess,
                onError,
                audioDestination
            ));

            /* eslint-disable no-empty-function */
            this.adapterSpeakStream().catch((): void => { });
        } catch (error) {
            this.handleSpeakError(error, err);
        }
    }

    /**
     * Get list of synthesis voices available.
     * The task returns the synthesis voice result.
     * @member SpeechSynthesizer.prototype.getVoicesAsync
     * @function
     * @async
     * @public
     * @param locale - Locale of voices in BCP-47 format; if left empty, get all available voices.
     * @return {Promise<SynthesisVoicesResult>} - Promise of a SynthesisVoicesResult.
     */
    public async getVoicesAsync(locale: string = ""): Promise<SynthesisVoicesResult> {
        return this.getVoices(locale);
    }

    /**
     * Dispose of associated resources.
     * @member SpeechSynthesizer.prototype.close
     * @function
     * @public
     */
    public close(cb?: () => void, err?: (error: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposed);

        marshalPromiseToCallbacks(this.dispose(true), cb, err);
    }

    /**
     * @Internal
     * Do not use externally, object returned will change without warning or notice.
     */
    public get internalData(): object {
        return this.privAdapter;
    }

    //
    // ################################################################################################################
    // IMPLEMENTATION.
    // ################################################################################################################
    //

    // Creates the synthesis adapter
    protected createSynthesisAdapter(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig): SynthesisAdapterBase {
        return new SpeechSynthesisAdapter(authentication, connectionFactory,
            synthesizerConfig, this, this.audioConfig as AudioOutputConfigImpl);
    }

    protected createRestSynthesisAdapter(
        authentication: IAuthentication,
        synthesizerConfig: SynthesizerConfig): SynthesisRestAdapter {
        return new SynthesisRestAdapter(synthesizerConfig, authentication);
    }

    protected implCommonSynthesizeSetup(): void {
        super.implCommonSynthesizeSetup();

        this.privAdapter.audioOutputFormat = AudioOutputFormatImpl.fromSpeechSynthesisOutputFormat(
            SpeechSynthesisOutputFormat[this.properties.getProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, undefined) as keyof typeof SpeechSynthesisOutputFormat]
        );
    }

    protected speakImpl(text: string, IsSsml: boolean, cb?: (e: SpeechSynthesisResult) => void, err?: (e: string) => void, dataStream?: AudioOutputStream | PushAudioOutputStreamCallback | PathLike): void {
        try {
            Contracts.throwIfDisposed(this.privDisposed);
            const requestId = createNoDashGuid();
            const audioDestination = this.resolveAudioDestination(dataStream);
            const { onSuccess, onError } = this.createSynthesisCallbacks(cb, err, (): void => {
                /* eslint-disable no-empty */
                this.adapterSpeak().catch((): void => { });
            });

            this.synthesisRequestQueue.enqueue(new SynthesisRequest(requestId, text, IsSsml, onSuccess, onError, audioDestination));

            /* eslint-disable no-empty-function */
            this.adapterSpeak().catch((): void => { });
        } catch (error) {
            this.handleSpeakError(error, err);
        }
    }

    private resolveAudioDestination(stream?: AudioOutputStream | PushAudioOutputStreamCallback | PathLike): IAudioDestination | undefined {
        if (stream instanceof PushAudioOutputStreamCallback) {
            return new PushAudioOutputStreamImpl(stream);
        } else if (stream instanceof PullAudioOutputStream) {
            return stream as PullAudioOutputStreamImpl;
        } else if (stream !== undefined) {
            return new AudioFileWriter(stream as PathLike);
        }
        return undefined;
    }

    private createSynthesisCallbacks(
        cb?: (e: SpeechSynthesisResult) => void,
        err?: (e: string) => void,
        processNext?: () => void
    ): { onSuccess: (e: SpeechSynthesisResult) => void; onError: (e: string) => void } {
        let successCb = cb;
        return {
            onError: (e: string): void => {
                this.privSynthesizing = false;
                if (!!err) {
                    err(e);
                }
            },
            onSuccess: (e: SpeechSynthesisResult): void => {
                this.privSynthesizing = false;
                if (!!successCb) {
                    try {
                        successCb(e);
                    } catch (e) {
                        if (!!err) {
                            err(e as string);
                        }
                    }
                }
                successCb = undefined;
                if (processNext) {
                    processNext();
                }
            }
        };
    }

    private handleSpeakError(error: unknown, err?: (e: string) => void): void {
        if (!!err) {
            if (error instanceof Error) {
                const typedError: Error = error;
                err(typedError.name + ": " + typedError.message);
            } else {
                err(error as string);
            }
        }
        // Destroy the synthesizer.
        /* eslint-disable no-empty */
        this.dispose(true).catch((): void => { });
    }

    protected async getVoices(locale: string): Promise<SynthesisVoicesResult> {
        const requestId = createNoDashGuid();
        const response: IRestResponse = await this.privRestAdapter.getVoicesList(requestId);
        if (response.ok && Array.isArray(response.json)) {
            let json = response.json;
            if (!!locale && locale.length > 0) {
                json = json.filter((item: { Locale: string }): boolean => !!item.Locale && item.Locale.toLowerCase() === locale.toLowerCase() );
            }
            return new SynthesisVoicesResult(requestId, json, undefined);
        } else {
            return new SynthesisVoicesResult(requestId, undefined, `Error: ${response.status}: ${response.statusText}`);
        }
   }
}
