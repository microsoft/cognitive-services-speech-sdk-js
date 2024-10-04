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
import { SynthesisRequest } from "./Synthesizer.js";

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
            let audioDestination;
            if (dataStream instanceof PushAudioOutputStreamCallback) {
                audioDestination = new PushAudioOutputStreamImpl(dataStream);
            } else if (dataStream instanceof PullAudioOutputStream) {
                audioDestination = dataStream as PullAudioOutputStreamImpl;
            } else if (dataStream !== undefined) {
                audioDestination = new AudioFileWriter(dataStream as PathLike);
            } else {
                audioDestination = undefined;
            }
            this.synthesisRequestQueue.enqueue(new SynthesisRequest(requestId, text, IsSsml, (e: SpeechSynthesisResult): void => {
                this.privSynthesizing = false;
                if (!!cb) {
                    try {
                        cb(e);
                    } catch (e) {
                        if (!!err) {
                            err(e as string);
                        }
                    }
                }
                cb = undefined;
                /* eslint-disable no-empty */
                this.adapterSpeak().catch((): void => { });

            }, (e: string): void => {
                if (!!err) {
                    err(e);
                }
            }, audioDestination));

            /* eslint-disable no-empty-function */
            this.adapterSpeak().catch((): void => { });

        } catch (error) {
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
