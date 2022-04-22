// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IConnectionFactory,
    RecognitionMode,
} from "../common.speech/Exports";
import {
    Deferred,
} from "../common/Exports";
import {
    Contracts
} from "./Contracts";
import {
    Client
} from "./Client";
import {
    AudioConfig,
    PropertyCollection,
    SpeechRecognitionResult,
} from "./Exports";

/**
 * Defines the base class Recognizer which mainly contains common event handlers.
 * @class Recognizer
 */
export abstract class Recognizer extends Client {

    /**
     * Creates and initializes an instance of a Recognizer
     * @constructor
     * @param {AudioConfig} audioInput - An optional audio input stream associated with the recognizer
     */
    protected constructor(audioConfig: AudioConfig, properties: PropertyCollection, connectionFactory: IConnectionFactory) {
        super(audioConfig, properties, connectionFactory);
    }

    //
    // ################################################################################################################
    // IMPLEMENTATION.
    // Move to independent class
    // ################################################################################################################
    //

    protected async recognizeOnceAsyncImpl(recognitionMode: RecognitionMode): Promise<SpeechRecognitionResult> {
        Contracts.throwIfDisposed(this.privDisposed);
        const ret: Deferred<SpeechRecognitionResult> = new Deferred<SpeechRecognitionResult>();

        await this.implRecognizerStop();
        await this.privReco.recognize(recognitionMode, ret.resolve, ret.reject);
        const result: SpeechRecognitionResult = await ret.promise;
        await this.implRecognizerStop();

        return result;

    }

    protected async startContinuousRecognitionAsyncImpl(recognitionMode: RecognitionMode): Promise<void> {
        Contracts.throwIfDisposed(this.privDisposed);

        await this.implRecognizerStop();
        await this.privReco.recognize(recognitionMode, undefined, undefined);
    }

    protected async stopContinuousRecognitionAsyncImpl(): Promise<void> {
        Contracts.throwIfDisposed(this.privDisposed);
        await this.implRecognizerStop();
    }

    protected async implRecognizerStop(): Promise<void> {
        if (this.privReco) {
            await this.privReco.stopRecognizing();
        }
        return;
    }
}
