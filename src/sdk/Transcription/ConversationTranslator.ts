// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

/* eslint-disable max-classes-per-file */

import {
    ConversationConnectionConfig,
    IAuthentication,
    ServicePropertiesPropertyName,
} from "../../common.speech/Exports.js";
import { ConversationTranslatorConnectionFactory } from "../../common.speech/Transcription/ConversationTranslatorConnectionFactory.js";
import {
    IDisposable,
    IErrorMessages,
    IStringDictionary,
    marshalPromiseToCallbacks
} from "../../common/Exports.js";
import { Contracts } from "../Contracts.js";
import {
    AudioConfig,
    CancellationErrorCode,
    CancellationReason,
    ProfanityOption,
    PropertyCollection,
    PropertyId,
    ServicePropertyChannel,
    SessionEventArgs,
    SpeechTranslationConfig,
    TranslationRecognitionEventArgs,
    TranslationRecognizer
} from "../Exports.js";
import { ConversationImpl } from "./Conversation.js";
import {
    ConversationCommon,
    ConversationExpirationEventArgs,
    ConversationHandler,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationEventArgs,
    IConversationTranslator,
    Participant
} from "./Exports.js";
import { Callback, IConversation } from "./IConversation.js";

export enum SpeechState {
    Inactive, Connecting, Connected
}

// child class of TranslationRecognizer meant only for use with ConversationTranslator
class ConversationTranslationRecognizer extends TranslationRecognizer {
    private privTranslator: ConversationTranslator;
    private privSpeechState: SpeechState;

    public constructor(speechConfig: SpeechTranslationConfig, audioConfig: AudioConfig, translator: ConversationTranslator, convGetter: () => ConversationImpl) {

        super(speechConfig, audioConfig, new ConversationTranslatorConnectionFactory(convGetter));

        this.privSpeechState = SpeechState.Inactive;
        if (!!translator) {
            this.privTranslator = translator;
            this.sessionStarted = (): void => {
                this.privSpeechState = SpeechState.Connected;
            };

            this.sessionStopped = (): void => {
                this.privSpeechState = SpeechState.Inactive;
            };

            this.recognizing = (tr: TranslationRecognizer, e: TranslationRecognitionEventArgs): void => {
                if (!!this.privTranslator.recognizing) {
                    this.privTranslator.recognizing(this.privTranslator, e);
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this.recognized = async (tr: TranslationRecognizer, e: TranslationRecognitionEventArgs): Promise<void> => {
                // if there is an error connecting to the conversation service from the speech service the error will be returned in the ErrorDetails field.
                if (e.result?.errorDetails) {
                    await this.cancelSpeech();
                    // TODO: format the error message contained in 'errorDetails'
                    this.fireCancelEvent(e.result.errorDetails);
                } else {
                    if (!!this.privTranslator.recognized) {
                        this.privTranslator.recognized(this.privTranslator, e);
                    }
                }
                return;
            };

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this.canceled = async (): Promise<void> => {
                if (this.privSpeechState !== SpeechState.Inactive) {
                    try {
                        await this.cancelSpeech();
                    } catch (error) {
                        this.privSpeechState = SpeechState.Inactive;
                    }
                }
            };
        }
    }

    public get state(): SpeechState {
        return this.privSpeechState;
    }

    public set state(newState: SpeechState) {
        this.privSpeechState = newState;
    }

    public set authentication(token: IAuthentication) {
        this.privReco.authentication = token;
    }


    public onConnection(): void {
        this.privSpeechState = SpeechState.Connected;
    }

    public async onCancelSpeech(): Promise<void> {
        this.privSpeechState = SpeechState.Inactive;
        await this.cancelSpeech();
    }

    /**
     * Fire a cancel event
     * @param error
     */
    private fireCancelEvent(error: string): void {
        try {
            if (!!this.privTranslator.canceled) {
                const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                    CancellationReason.Error,
                    error,
                    CancellationErrorCode.RuntimeError
                    );

                this.privTranslator.canceled(this.privTranslator, cancelEvent);
            }
        } catch (e) {
            //
        }
    }

    private async cancelSpeech(): Promise<void> {
        try {
            this.stopContinuousRecognitionAsync();
            await this.privReco?.disconnect();
            this.privSpeechState = SpeechState.Inactive;
        } catch (e) {
            // ignore the error
        }
    }
}

/**
 * Join, leave or connect to a conversation.
 */
export class ConversationTranslator extends ConversationCommon implements IConversationTranslator, IDisposable {

    public canceled: (sender: ConversationHandler, event: ConversationTranslationCanceledEventArgs) => void;
    public conversationExpiration: (sender: IConversationTranslator, event: ConversationExpirationEventArgs) => void;
    public participantsChanged: (sender: IConversationTranslator, event: ConversationParticipantsChangedEventArgs) => void;
    public sessionStarted: (sender: ConversationHandler, event: SessionEventArgs) => void;
    public sessionStopped: (sender: ConversationHandler, event: SessionEventArgs) => void;
    public textMessageReceived: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;

    // Callbacks for whole conversation results
    public transcribed: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;
    public transcribing: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;

    // Callbacks for detecting speech/translation results from self
    public recognized: (sender: IConversationTranslator, event: TranslationRecognitionEventArgs) => void;
    public recognizing: (sender: IConversationTranslator, event: TranslationRecognitionEventArgs) => void;

    private privSpeechRecognitionLanguage: string;
    private privProperties: PropertyCollection;
    private privIsDisposed: boolean;
    private privCTRecognizer: ConversationTranslationRecognizer;
    private privIsSpeaking: boolean;
    private privConversation: ConversationImpl;
    private privErrors: IErrorMessages = ConversationConnectionConfig.restErrors;
    private privPlaceholderKey: string;
    private privPlaceholderRegion: string;

    public constructor(audioConfig?: AudioConfig) {
        super(audioConfig);
        this.privIsDisposed = false;
        this.privIsSpeaking = false;
        this.privPlaceholderKey = "abcdefghijklmnopqrstuvwxyz012345";
        this.privPlaceholderRegion = "westus";
        this.privProperties = new PropertyCollection();
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public get speechRecognitionLanguage(): string {
        return this.privSpeechRecognitionLanguage;
    }

    public get participants(): Participant[] {
        return this.privConversation?.participants;
    }

    private get canSpeak(): boolean {

        // is there a Conversation websocket available and has the Recognizer been set up
        if (!this.privConversation.isConnected || !this.privCTRecognizer) {
            return false;
        }

        // is the user already speaking
        if (this.privIsSpeaking || this.privCTRecognizer.state === SpeechState.Connected || this.privCTRecognizer.state === SpeechState.Connecting) {
            return false;
        }

        // is the user muted
        if (this.privConversation.isMutedByHost) {
            return false;
        }

        return true;
    }

    public onToken(token: IAuthentication): void {
        this.privCTRecognizer.authentication = token;
    }

    public setServiceProperty(name: string, value: string): void {
        const currentProperties: IStringDictionary<string> = JSON.parse(this.privProperties.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;

        currentProperties[name] = value;

        this.privProperties.setProperty(ServicePropertiesPropertyName, JSON.stringify(currentProperties));
    }

    /**
     * Join a conversation. If this is the host, pass in the previously created Conversation object.
     * @param conversation
     * @param nickname
     * @param lang
     * @param cb
     * @param err
     */
    public joinConversationAsync(conversation: IConversation, nickname: string, cb?: Callback, err?: Callback): void;
    public joinConversationAsync(conversationId: string, nickname: string, lang: string, cb?: Callback, err?: Callback): void;
    public joinConversationAsync(conversation: string | IConversation, nickname: string, param1?: string | Callback, param2?: Callback, param3?: Callback): void {

        try {

            if (typeof conversation === "string") {

                Contracts.throwIfNullOrUndefined(conversation, this.privErrors.invalidArgs.replace("{arg}", "conversation id"));
                Contracts.throwIfNullOrWhitespace(nickname, this.privErrors.invalidArgs.replace("{arg}", "nickname"));

                if (!!this.privConversation) {
                    this.handleError(new Error(this.privErrors.permissionDeniedStart), param3);
                }

                let lang: string = param1 as string;
                if (lang === undefined || lang === null || lang === "") {
                    lang = ConversationConnectionConfig.defaultLanguageCode;
                }

                // create a placeholder config
                this.privSpeechTranslationConfig = SpeechTranslationConfig.fromSubscription(
                    this.privPlaceholderKey,
                    this.privPlaceholderRegion);
                this.privSpeechTranslationConfig.setProfanity(ProfanityOption.Masked);
                this.privSpeechTranslationConfig.addTargetLanguage(lang);
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage], lang);
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_Name], nickname);

                const propertyIdsToCopy: (string | PropertyId)[] = [
                    PropertyId.SpeechServiceConnection_Host,
                    PropertyId.ConversationTranslator_Host,
                    PropertyId.SpeechServiceConnection_Endpoint,
                    PropertyId.SpeechServiceConnection_ProxyHostName,
                    PropertyId.SpeechServiceConnection_ProxyPassword,
                    PropertyId.SpeechServiceConnection_ProxyPort,
                    PropertyId.SpeechServiceConnection_ProxyUserName,
                    "ConversationTranslator_MultiChannelAudio",
                    "ConversationTranslator_Region"
                ];

                for (const prop of propertyIdsToCopy) {
                    const value = this.privProperties.getProperty(prop);
                    if (value) {
                        const key = typeof prop === "string" ? prop : PropertyId[prop];
                        this.privSpeechTranslationConfig.setProperty(key, value);
                    }
                }

                const currentProperties  = JSON.parse(this.privProperties.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;
                for (const prop of Object.keys(currentProperties)) {
                    this.privSpeechTranslationConfig.setServiceProperty(prop, currentProperties[prop], ServicePropertyChannel.UriQueryParameter);
                }

                // join the conversation
                this.privConversation = new ConversationImpl(this.privSpeechTranslationConfig);
                this.privConversation.conversationTranslator = this;

                this.privConversation.joinConversationAsync(
                    conversation,
                    nickname,
                    lang,
                    ((result: string): void => {

                        if (!result) {
                            this.handleError(new Error(this.privErrors.permissionDeniedConnect), param3);
                        }

                        this.privSpeechTranslationConfig.authorizationToken = result;
                        this.privConversation.room.isHost = false;

                        // connect to the ws
                        this.privConversation.startConversationAsync(
                            ((): void => {
                                this.handleCallback(param2, param3);
                            }),
                            ((error: any): void => {
                                this.handleError(error, param3);
                            }));

                    }),
                    ((error: any): void => {
                        this.handleError(error, param3);
                    }));

            } else if (typeof conversation === "object") {

                Contracts.throwIfNullOrUndefined(conversation, this.privErrors.invalidArgs.replace("{arg}", "conversation id"));
                Contracts.throwIfNullOrWhitespace(nickname, this.privErrors.invalidArgs.replace("{arg}", "nickname"));

                // save the nickname
                this.privProperties.setProperty(PropertyId.ConversationTranslator_Name, nickname);
                // ref the conversation object
                this.privConversation = conversation as ConversationImpl;
                // ref the conversation translator object
                this.privConversation.conversationTranslator = this;
                this.privConversation.room.isHost = true;

                Contracts.throwIfNullOrUndefined(this.privConversation, this.privErrors.permissionDeniedConnect);
                Contracts.throwIfNullOrUndefined(this.privConversation.room.token, this.privErrors.permissionDeniedConnect);

                this.privSpeechTranslationConfig = conversation.config;

                this.handleCallback(param1 as Callback, param2);
            } else {
                this.handleError(
                    new Error(this.privErrors.invalidArgs.replace("{arg}", "invalid conversation type")),
                    param2);
            }

        } catch (error) {
            this.handleError(error, typeof param1 === "string" ? param3 : param2);
        }
    }

    /**
     * Leave the conversation
     * @param cb
     * @param err
     */
    public leaveConversationAsync(cb?: Callback, err?: Callback): void {

        marshalPromiseToCallbacks((async (): Promise<void> => {

            // stop the speech websocket
            await this.cancelSpeech();
            // stop the websocket
            await this.privConversation.endConversationImplAsync();
            // https delete request
            await this.privConversation.deleteConversationImplAsync();
            this.dispose();

        })(), cb, err);
    }

    /**
     * Send a text message
     * @param message
     * @param cb
     * @param err
     */
    public sendTextMessageAsync(message: string, cb?: Callback, err?: Callback): void {

        try {
            Contracts.throwIfNullOrUndefined(this.privConversation, this.privErrors.permissionDeniedSend);
            Contracts.throwIfNullOrWhitespace(message, this.privErrors.invalidArgs.replace("{arg}", message));

            this.privConversation.sendTextMessageAsync(message, cb, err);
        } catch (error) {

            this.handleError(error, err);
        }
    }

    /**
     * Start speaking
     * @param cb
     * @param err
     */
    public startTranscribingAsync(cb?: Callback, err?: Callback): void {
        marshalPromiseToCallbacks((async (): Promise<void> => {
            try {
                Contracts.throwIfNullOrUndefined(this.privConversation, this.privErrors.permissionDeniedSend);
                Contracts.throwIfNullOrUndefined(this.privConversation.room.token, this.privErrors.permissionDeniedConnect);

                if (this.privCTRecognizer === undefined) {
                    await this.connectTranslatorRecognizer();
                }
                Contracts.throwIfNullOrUndefined(this.privCTRecognizer, this.privErrors.permissionDeniedSend);

                if (!this.canSpeak) {
                    this.handleError(new Error(this.privErrors.permissionDeniedSend), err);
                }

                await this.startContinuousRecognition();

                this.privIsSpeaking = true;
            } catch (error) {
                this.privIsSpeaking = false;
                await this.cancelSpeech();
                throw error;
            }
        })(), cb, err);
    }

    /**
     * Stop speaking
     * @param cb
     * @param err
     */
    public stopTranscribingAsync(cb?: Callback, err?: Callback): void {
        marshalPromiseToCallbacks((async (): Promise<void> => {
            try {
                if (!this.privIsSpeaking) {
                    // stop speech
                    await this.cancelSpeech();
                    return;
                }

                // stop the recognition but leave the websocket open
                this.privIsSpeaking = false;
                await new Promise<void>((resolve: (value: void) => void, reject: (reason?: any) => void): void => {
                    this.privCTRecognizer.stopContinuousRecognitionAsync(resolve, reject);
                });

            } catch (error) {
                await this.cancelSpeech();
            }
        })(), cb, err);
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string, success?: () => void, err?: (error: string) => void): void {
        marshalPromiseToCallbacks((async (): Promise<void> => {
            if (this.isDisposed && !this.privIsSpeaking) {
                return;
            }
            await this.cancelSpeech();
            this.privIsDisposed = true;
            this.privSpeechTranslationConfig.close();
            this.privSpeechRecognitionLanguage = undefined;
            this.privProperties = undefined;
            this.privAudioConfig = undefined;
            this.privSpeechTranslationConfig = undefined;
            this.privConversation.dispose();
            this.privConversation = undefined;
        })(), success, err);
    }

    /**
     * Cancel the speech websocket
     */
    private async cancelSpeech(): Promise<void> {
        try {
            this.privIsSpeaking = false;
            await this.privCTRecognizer?.onCancelSpeech();
            this.privCTRecognizer = undefined;
        } catch (e) {
            // ignore the error
        }
    }

    /**
     * Connect to the speech translation recognizer.
     * Currently there is no language validation performed before sending the SpeechLanguage code to the service.
     * If it's an invalid language the raw error will be: 'Error during WebSocket handshake: Unexpected response code: 400'
     * e.g. pass in 'fr' instead of 'fr-FR', or a text-only language 'cy'
     */
    private async connectTranslatorRecognizer(): Promise<void> {
        try {

            if (this.privAudioConfig === undefined) {
                this.privAudioConfig = AudioConfig.fromDefaultMicrophoneInput();
            }

            // clear the temp subscription key if it's a participant joining
            if (this.privSpeechTranslationConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_Key])
                === this.privPlaceholderKey) {
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Key], "");
            }

            const convGetter = (): ConversationImpl => this.privConversation;
            this.privCTRecognizer = new ConversationTranslationRecognizer(this.privSpeechTranslationConfig, this.privAudioConfig, this, convGetter);
        } catch (error) {
            await this.cancelSpeech();
            throw error;
        }
    }

    /**
     * Handle the start speaking request
     */
    private startContinuousRecognition(): Promise<void> {
        return new Promise((resolve: () => void, reject: (error: string) => void): void => {
            this.privCTRecognizer.startContinuousRecognitionAsync(resolve, reject);
        });
    }
}
