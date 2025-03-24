// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    AddedLmIntent,
    IAuthentication,
    IConnectionFactory,
    IntentConnectionFactory,
    IntentServiceRecognizer,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig
} from "../common.speech/Exports.js";
import { RecognitionMode } from "../common.speech/ServiceMessages/PhraseDetection/PhraseDetectionContext.js";
import { marshalPromiseToCallbacks } from "../common/Exports.js";
import { AudioConfigImpl } from "./Audio/AudioConfig.js";
import { Contracts } from "./Contracts.js";
import {
    AudioConfig,
    IntentRecognitionCanceledEventArgs,
    IntentRecognitionEventArgs,
    IntentRecognitionResult,
    KeywordRecognitionModel,
    LanguageUnderstandingModel,
    PropertyCollection,
    PropertyId,
    Recognizer,
    SpeechConfig,
} from "./Exports.js";
import { LanguageUnderstandingModelImpl } from "./LanguageUnderstandingModel.js";
import { SpeechConfigImpl } from "./SpeechConfig.js";

/**
 * Intent recognizer.
 * @class
 */
export class IntentRecognizer extends Recognizer {
    private privDisposedIntentRecognizer: boolean;
    private privAddedIntents: string[][];
    private privAddedLmIntents: { [id: string]: AddedLmIntent };
    private privUmbrellaIntent: AddedLmIntent;

    /**
     * Initializes an instance of the IntentRecognizer.
     * @constructor
     * @param {SpeechConfig} speechConfig - The set of configuration properties.
     * @param {AudioConfig} audioConfig - An optional audio input config associated with the recognizer
     */
    public constructor(speechConfig: SpeechConfig, audioConfig?: AudioConfig) {
        Contracts.throwIfNullOrUndefined(speechConfig, "speechConfig");
        const configImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNullOrUndefined(configImpl, "speechConfig");

        super(audioConfig, configImpl.properties, new IntentConnectionFactory());
        this.privAddedIntents = [];
        this.privAddedLmIntents = {};

        this.privDisposedIntentRecognizer = false;
        this.privProperties = configImpl.properties;

        Contracts.throwIfNullOrWhitespace(this.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage), PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);
    }

    /**
     * The event recognizing signals that an intermediate recognition result is received.
     * @member IntentRecognizer.prototype.recognizing
     * @function
     * @public
     */
    public recognizing: (sender: IntentRecognizer, event: IntentRecognitionEventArgs) => void;

    /**
     * The event recognized signals that a final recognition result is received.
     * @member IntentRecognizer.prototype.recognized
     * @function
     * @public
     */
    public recognized: (sender: IntentRecognizer, event: IntentRecognitionEventArgs) => void;

    /**
     * The event canceled signals that an error occurred during recognition.
     * @member IntentRecognizer.prototype.canceled
     * @function
     * @public
     */
    public canceled: (sender: IntentRecognizer, event: IntentRecognitionCanceledEventArgs) => void;

    /**
     * Gets the spoken language of recognition.
     * @member IntentRecognizer.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @returns {string} the spoken language of recognition.
     */
    public get speechRecognitionLanguage(): string {
        Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
    }

    /**
     * Gets the authorization token used to communicate with the service.
     * @member IntentRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    /**
     * Gets/Sets the authorization token used to communicate with the service.
     * Note: Please use a token derived from your LanguageUnderstanding subscription key for the Intent recognizer.
     * @member IntentRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @param {string} value - Authorization token.
     */
    public set authorizationToken(value: string) {
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, value);
    }

    /**
     * The collection of properties and their values defined for this IntentRecognizer.
     * @member IntentRecognizer.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their
     * values defined for this IntentRecognizer.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * Starts intent recognition, and stops after the first utterance is recognized.
     * The task returns the recognition text and intent as result.
     * Note: RecognizeOnceAsync() returns when the first utterance has been recognized,
     * so it is suitable only for single shot recognition like command or query.
     * For long-running recognition, use StartContinuousRecognitionAsync() instead.
     * @member IntentRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the recognition has finished with an IntentRecognitionResult.
     * @param err - Callback invoked in case of an error.
     */
    public recognizeOnceAsync(cb?: (e: IntentRecognitionResult) => void, err?: (e: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);

        if (Object.keys(this.privAddedLmIntents).length !== 0 || undefined !== this.privUmbrellaIntent) {
            const context: IIntentContext = this.buildSpeechContext();

            this.privReco.speechContext.getContext().intent = context.Intent;
            this.privReco.dynamicGrammar.addReferenceGrammar(context.ReferenceGrammars);

            const intentReco: IntentServiceRecognizer = this.privReco as IntentServiceRecognizer;
            intentReco.setIntents(this.privAddedLmIntents, this.privUmbrellaIntent);
        }

        marshalPromiseToCallbacks(this.recognizeOnceAsyncImpl(RecognitionMode.Interactive), cb, err);
    }

    /**
     * Starts speech recognition, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * @member IntentRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    public startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        if (Object.keys(this.privAddedLmIntents).length !== 0 || undefined !== this.privUmbrellaIntent) {
            const context: IIntentContext = this.buildSpeechContext();

            this.privReco.speechContext.getContext().intent = context.Intent;
            this.privReco.dynamicGrammar.addReferenceGrammar(context.ReferenceGrammars);

            const intentReco: IntentServiceRecognizer = this.privReco as IntentServiceRecognizer;
            intentReco.setIntents(this.privAddedLmIntents, this.privUmbrellaIntent);
        }

        marshalPromiseToCallbacks(this.startContinuousRecognitionAsyncImpl(RecognitionMode.Conversation), cb, err);
    }

    /**
     * Stops continuous intent recognition.
     * @member IntentRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    public stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.stopContinuousRecognitionAsyncImpl(), cb, err);
    }

    /**
     * Starts speech recognition with keyword spotting, until stopKeywordRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * Note: Key word spotting functionality is only available on the Speech Devices SDK.
     * This functionality is currently not included in the SDK itself.
     * @member IntentRecognizer.prototype.startKeywordRecognitionAsync
     * @function
     * @public
     * @param {KeywordRecognitionModel} model - The keyword recognition model that specifies the keyword to be recognized.
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    public startKeywordRecognitionAsync(model: KeywordRecognitionModel, cb?: () => void, err?: (e: string) => void): void {
        Contracts.throwIfNull(model, "model");

        if (!!err) {
            err("Not yet implemented.");
        }
    }

    /**
     * Stops continuous speech recognition.
     * Note: Key word spotting functionality is only available on the Speech Devices SDK.
     * This functionality is currently not included in the SDK itself.
     * @member IntentRecognizer.prototype.stopKeywordRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    public stopKeywordRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        if (!!cb) {
            try {
                cb();
            } catch (e) {
                if (!!err) {
                    err(e as string);
                }
            }
        }
    }

    /**
     * Adds a phrase that should be recognized as intent.
     * @member IntentRecognizer.prototype.addIntent
     * @function
     * @public
     * @param {string} intentId - A String that represents the identifier of the intent to be recognized.
     * @param {string} phrase - A String that specifies the phrase representing the intent.
     */
    public addIntent(simplePhrase: string, intentId?: string): void {
        Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        Contracts.throwIfNullOrWhitespace(intentId, "intentId");
        Contracts.throwIfNullOrWhitespace(simplePhrase, "simplePhrase");

        this.privAddedIntents.push([intentId, simplePhrase]);
    }

    /**
     * Adds an intent from Language Understanding service for recognition.
     * @member IntentRecognizer.prototype.addIntentWithLanguageModel
     * @function
     * @public
     * @param {string} intentId - A String that represents the identifier of the intent
     * to be recognized. Ignored if intentName is empty.
     * @param {string} model - The intent model from Language Understanding service.
     * @param {string} intentName - The intent name defined in the intent model. If it
     * is empty, all intent names defined in the model will be added.
     */
    public addIntentWithLanguageModel(intentId: string, model: LanguageUnderstandingModel, intentName?: string): void {
        Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        Contracts.throwIfNullOrWhitespace(intentId, "intentId");
        Contracts.throwIfNull(model, "model");

        const modelImpl: LanguageUnderstandingModelImpl = model as LanguageUnderstandingModelImpl;
        Contracts.throwIfNullOrWhitespace(modelImpl.appId, "model.appId");

        this.privAddedLmIntents[intentId] = new AddedLmIntent(modelImpl, intentName);
    }

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
    public addAllIntents(model: LanguageUnderstandingModel, intentId?: string): void {
        Contracts.throwIfNull(model, "model");

        const modelImpl: LanguageUnderstandingModelImpl = model as LanguageUnderstandingModelImpl;
        Contracts.throwIfNullOrWhitespace(modelImpl.appId, "model.appId");

        this.privUmbrellaIntent = new AddedLmIntent(modelImpl, intentId);
    }

    /**
     * closes all external resources held by an instance of this class.
     * @member IntentRecognizer.prototype.close
     * @function
     * @public
     */
    public close(cb?: () => void, errorCb?: (error: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);

        marshalPromiseToCallbacks(this.dispose(true), cb, errorCb);
    }

    protected createRecognizerConfig(speechConfig: SpeechServiceConfig): RecognizerConfig {
        return new RecognizerConfig(speechConfig, this.privProperties);
    }

    protected createServiceRecognizer(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioConfig: AudioConfig, recognizerConfig: RecognizerConfig): ServiceRecognizerBase {
        const audioImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        return new IntentServiceRecognizer(authentication, connectionFactory, audioImpl, recognizerConfig, this);
    }

    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposedIntentRecognizer) {
            return;
        }

        if (disposing) {
            this.privDisposedIntentRecognizer = true;
            await super.dispose(disposing);
        }
    }

    private buildSpeechContext(): IIntentContext {
        let appId: string;
        let region: string;
        let subscriptionKey: string;
        const refGrammers: string[] = [];

        if (undefined !== this.privUmbrellaIntent) {
            appId = this.privUmbrellaIntent.modelImpl.appId;
            region = this.privUmbrellaIntent.modelImpl.region;
            subscriptionKey = this.privUmbrellaIntent.modelImpl.subscriptionKey;
        }

        // Build the reference grammer array.
        for (const intentId of Object.keys(this.privAddedLmIntents)) {
            const addedLmIntent: AddedLmIntent = this.privAddedLmIntents[intentId];

            // validate all the same model, region, and key...
            if (appId === undefined) {
                appId = addedLmIntent.modelImpl.appId;
            } else {
                if (appId !== addedLmIntent.modelImpl.appId) {
                    throw new Error("Intents must all be from the same LUIS model");
                }
            }

            if (region === undefined) {
                region = addedLmIntent.modelImpl.region;
            } else {
                if (region !== addedLmIntent.modelImpl.region) {
                    throw new Error("Intents must all be from the same LUIS model in a single region");
                }
            }

            if (subscriptionKey === undefined) {
                subscriptionKey = addedLmIntent.modelImpl.subscriptionKey;
            } else {
                if (subscriptionKey !== addedLmIntent.modelImpl.subscriptionKey) {
                    throw new Error("Intents must all use the same subscription key");
                }
            }

            const grammer: string = "luis/" + appId + "-PRODUCTION#" + intentId;
            refGrammers.push(grammer);
        }

        return {
            Intent: {
                id: appId,
                key: (subscriptionKey === undefined) ? this.privProperties.getProperty(PropertyId[PropertyId.SpeechServiceConnection_Key]) : subscriptionKey,
                provider: "LUIS",
            },
            ReferenceGrammars: (undefined === this.privUmbrellaIntent) ? refGrammers : ["luis/" + appId + "-PRODUCTION"],
        };
    }
}

interface IIntentContext {
    Intent: {
        id: string;
        key: string;
        provider: string;
    };
    ReferenceGrammars: string[];
}
