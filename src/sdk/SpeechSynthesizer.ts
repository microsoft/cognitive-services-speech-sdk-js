// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PathLike } from "fs";
import { IRestResponse } from "../common.browser/RestMessageAdapter";
import {
    AutoDetectSourceLanguagesOpenRangeOptionName,
    CognitiveSubscriptionKeyAuthentication,
    CognitiveTokenAuthentication,
    Context,
    IAuthentication,
    ISynthesisConnectionFactory,
    OS,
    SpeechServiceConfig,
    SpeechSynthesisConnectionFactory,
    SynthesisAdapterBase,
    SynthesisRestAdapter,
    SynthesizerConfig,
} from "../common.speech/Exports";
import {
    createNoDashGuid,
    IAudioDestination,
    IStringDictionary,
    marshalPromiseToCallbacks,
    Queue
} from "../common/Exports";
import { AudioOutputConfigImpl } from "./Audio/AudioConfig";
import { AudioFileWriter } from "./Audio/AudioFileWriter";
import { AudioOutputFormatImpl } from "./Audio/AudioOutputFormat";
import {
    PullAudioOutputStreamImpl,
    PushAudioOutputStreamImpl
} from "./Audio/AudioOutputStream";
import { Contracts } from "./Contracts";
import {
    AudioConfig,
    AudioOutputStream,
    AutoDetectSourceLanguageConfig,
    PropertyCollection,
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
} from "./Exports";
import { SpeechConfigImpl } from "./SpeechConfig";

/**
 * Defines the class SpeechSynthesizer for text to speech.
 * Updated in version 1.16.0
 * @class SpeechSynthesizer
 */
export class SpeechSynthesizer {
    protected audioConfig: AudioConfig;
    protected privAdapter: SynthesisAdapterBase;
    protected privRestAdapter: SynthesisRestAdapter;
    protected privProperties: PropertyCollection;
    protected synthesisRequestQueue: Queue<SynthesisRequest>;

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
     * Gets the authorization token used to communicate with the service.
     * @member SpeechSynthesizer.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    /**
     * Gets/Sets the authorization token used to communicate with the service.
     * @member SpeechSynthesizer.prototype.authorizationToken
     * @function
     * @public
     * @param {string} token - Authorization token.
     */
    public set authorizationToken(token: string) {
        Contracts.throwIfNullOrWhitespace(token, "token");
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, token);
    }

    /**
     * The collection of properties and their values defined for this SpeechSynthesizer.
     * @member SpeechSynthesizer.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this SpeechSynthesizer.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * Indicates if auto detect source language is enabled
     * @member SpeechSynthesizer.prototype.properties
     * @function
     * @public
     * @returns {boolean} if auto detect source language is enabled
     */
    public get autoDetectSourceLanguage(): boolean {
        return this.properties.getProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages) === AutoDetectSourceLanguagesOpenRangeOptionName;
    }

    private privDisposed: boolean;
    private privConnectionFactory: ISynthesisConnectionFactory;
    private privSynthesizing: boolean;

    /**
     * SpeechSynthesizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this synthesizer.
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the synthesizer.
     */
    public constructor(speechConfig: SpeechConfig, audioConfig?: AudioConfig) {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNull(speechConfigImpl, "speechConfig");

        if (audioConfig !== null) {
            if (audioConfig === undefined) {
                this.audioConfig = (typeof window === "undefined") ? undefined : AudioConfig.fromDefaultSpeakerOutput();
            } else {
                this.audioConfig = audioConfig;
            }
        }

        this.privProperties = speechConfigImpl.properties.clone();
        this.privDisposed = false;
        this.privSynthesizing = false;
        this.privConnectionFactory = new SpeechSynthesisConnectionFactory();
        this.synthesisRequestQueue = new Queue<SynthesisRequest>();
        this.implCommonSynthesizeSetup();
    }

    /**
     * SpeechSynthesizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - an set of initial properties for this synthesizer
     * @param {AutoDetectSourceLanguageConfig} autoDetectSourceLanguageConfig - An source language detection configuration associated with the synthesizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the synthesizer
     */
    public static FromConfig(speechConfig: SpeechConfig, autoDetectSourceLanguageConfig: AutoDetectSourceLanguageConfig, audioConfig?: AudioConfig): SpeechSynthesizer {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        autoDetectSourceLanguageConfig.properties.mergeTo(speechConfigImpl.properties);
        return new SpeechSynthesizer(speechConfig, audioConfig);
    }

    public buildSsml(text: string): string {
        const languageToDefaultVoice: IStringDictionary<string>  = {
            ["af-ZA"]: "af-ZA-AdriNeural",
            ["am-ET"]: "am-ET-AmehaNeural",
            ["ar-AE"]: "ar-AE-FatimaNeural",
            ["ar-BH"]: "ar-BH-AliNeural",
            ["ar-DZ"]: "ar-DZ-AminaNeural",
            ["ar-EG"]: "ar-EG-SalmaNeural",
            ["ar-IQ"]: "ar-IQ-BasselNeural",
            ["ar-JO"]: "ar-JO-SanaNeural",
            ["ar-KW"]: "ar-KW-FahedNeural",
            ["ar-LY"]: "ar-LY-ImanNeural",
            ["ar-MA"]: "ar-MA-JamalNeural",
            ["ar-QA"]: "ar-QA-AmalNeural",
            ["ar-SA"]: "ar-SA-HamedNeural",
            ["ar-SY"]: "ar-SY-AmanyNeural",
            ["ar-TN"]: "ar-TN-HediNeural",
            ["ar-YE"]: "ar-YE-MaryamNeural",
            ["bg-BG"]: "bg-BG-BorislavNeural",
            ["bn-BD"]: "bn-BD-NabanitaNeural",
            ["bn-IN"]: "bn-IN-BashkarNeural",
            ["ca-ES"]: "ca-ES-JoanaNeural",
            ["cs-CZ"]: "cs-CZ-AntoninNeural",
            ["cy-GB"]: "cy-GB-AledNeural",
            ["da-DK"]: "da-DK-ChristelNeural",
            ["de-AT"]: "de-AT-IngridNeural",
            ["de-CH"]: "de-CH-JanNeural",
            ["de-DE"]: "de-DE-KatjaNeural",
            ["el-GR"]: "el-GR-AthinaNeural",
            ["en-AU"]: "en-AU-NatashaNeural",
            ["en-CA"]: "en-CA-ClaraNeural",
            ["en-GB"]: "en-GB-LibbyNeural",
            ["en-HK"]: "en-HK-SamNeural",
            ["en-IE"]: "en-IE-ConnorNeural",
            ["en-IN"]: "en-IN-NeerjaNeural",
            ["en-KE"]: "en-KE-AsiliaNeural",
            ["en-NG"]: "en-NG-AbeoNeural",
            ["en-NZ"]: "en-NZ-MitchellNeural",
            ["en-PH"]: "en-PH-JamesNeural",
            ["en-SG"]: "en-SG-LunaNeural",
            ["en-TZ"]: "en-TZ-ElimuNeural",
            ["en-US"]: "en-US-JennyNeural",
            ["en-ZA"]: "en-ZA-LeahNeural",
            ["es-AR"]: "es-AR-ElenaNeural",
            ["es-BO"]: "es-BO-MarceloNeural",
            ["es-CL"]: "es-CL-CatalinaNeural",
            ["es-CO"]: "es-CO-GonzaloNeural",
            ["es-CR"]: "es-CR-JuanNeural",
            ["es-CU"]: "es-CU-BelkysNeural",
            ["es-DO"]: "es-DO-EmilioNeural",
            ["es-EC"]: "es-EC-AndreaNeural",
            ["es-ES"]: "es-ES-AlvaroNeural",
            ["es-GQ"]: "es-GQ-JavierNeural",
            ["es-GT"]: "es-GT-AndresNeural",
            ["es-HN"]: "es-HN-CarlosNeural",
            ["es-MX"]: "es-MX-DaliaNeural",
            ["es-NI"]: "es-NI-FedericoNeural",
            ["es-PA"]: "es-PA-MargaritaNeural",
            ["es-PE"]: "es-PE-AlexNeural",
            ["es-PR"]: "es-PR-KarinaNeural",
            ["es-PY"]: "es-PY-MarioNeural",
            ["es-SV"]: "es-SV-LorenaNeural",
            ["es-US"]: "es-US-AlonsoNeural",
            ["es-UY"]: "es-UY-MateoNeural",
            ["es-VE"]: "es-VE-PaolaNeural",
            ["et-EE"]: "et-EE-AnuNeural",
            ["fa-IR"]: "fa-IR-DilaraNeural",
            ["fi-FI"]: "fi-FI-SelmaNeural",
            ["fil-PH"]: "fil-PH-AngeloNeural",
            ["fr-BE"]: "fr-BE-CharlineNeural",
            ["fr-CA"]: "fr-CA-SylvieNeural",
            ["fr-CH"]: "fr-CH-ArianeNeural",
            ["fr-FR"]: "fr-FR-DeniseNeural",
            ["ga-IE"]: "ga-IE-ColmNeural",
            ["gl-ES"]: "gl-ES-RoiNeural",
            ["gu-IN"]: "gu-IN-DhwaniNeural",
            ["he-IL"]: "he-IL-AvriNeural",
            ["hi-IN"]: "hi-IN-MadhurNeural",
            ["hr-HR"]: "hr-HR-GabrijelaNeural",
            ["hu-HU"]: "hu-HU-NoemiNeural",
            ["id-ID"]: "id-ID-ArdiNeural",
            ["is-IS"]: "is-IS-GudrunNeural",
            ["it-IT"]: "it-IT-IsabellaNeural",
            ["ja-JP"]: "ja-JP-NanamiNeural",
            ["jv-ID"]: "jv-ID-DimasNeural",
            ["kk-KZ"]: "kk-KZ-AigulNeural",
            ["km-KH"]: "km-KH-PisethNeural",
            ["kn-IN"]: "kn-IN-GaganNeural",
            ["ko-KR"]: "ko-KR-SunHiNeural",
            ["lo-LA"]: "lo-LA-ChanthavongNeural",
            ["lt-LT"]: "lt-LT-LeonasNeural",
            ["lv-LV"]: "lv-LV-EveritaNeural",
            ["mk-MK"]: "mk-MK-AleksandarNeural",
            ["ml-IN"]: "ml-IN-MidhunNeural",
            ["mr-IN"]: "mr-IN-AarohiNeural",
            ["ms-MY"]: "ms-MY-OsmanNeural",
            ["mt-MT"]: "mt-MT-GraceNeural",
            ["my-MM"]: "my-MM-NilarNeural",
            ["nb-NO"]: "nb-NO-PernilleNeural",
            ["nl-BE"]: "nl-BE-ArnaudNeural",
            ["nl-NL"]: "nl-NL-ColetteNeural",
            ["pl-PL"]: "pl-PL-AgnieszkaNeural",
            ["ps-AF"]: "ps-AF-GulNawazNeural",
            ["pt-BR"]: "pt-BR-FranciscaNeural",
            ["pt-PT"]: "pt-PT-DuarteNeural",
            ["ro-RO"]: "ro-RO-AlinaNeural",
            ["ru-RU"]: "ru-RU-SvetlanaNeural",
            ["si-LK"]: "si-LK-SameeraNeural",
            ["sk-SK"]: "sk-SK-LukasNeural",
            ["sl-SI"]: "sl-SI-PetraNeural",
            ["so-SO"]: "so-SO-MuuseNeural",
            ["sr-RS"]: "sr-RS-NicholasNeural",
            ["su-ID"]: "su-ID-JajangNeural",
            ["sv-SE"]: "sv-SE-SofieNeural",
            ["sw-KE"]: "sw-KE-RafikiNeural",
            ["sw-TZ"]: "sw-TZ-DaudiNeural",
            ["ta-IN"]: "ta-IN-PallaviNeural",
            ["ta-LK"]: "ta-LK-KumarNeural",
            ["ta-SG"]: "ta-SG-AnbuNeural",
            ["te-IN"]: "te-IN-MohanNeural",
            ["th-TH"]: "th-TH-PremwadeeNeural",
            ["tr-TR"]: "tr-TR-AhmetNeural",
            ["uk-UA"]: "uk-UA-OstapNeural",
            ["ur-IN"]: "ur-IN-GulNeural",
            ["ur-PK"]: "ur-PK-AsadNeural",
            ["uz-UZ"]: "uz-UZ-MadinaNeural",
            ["vi-VN"]: "vi-VN-HoaiMyNeural",
            ["zh-CN"]: "zh-CN-XiaoxiaoNeural",
            ["zh-HK"]: "zh-HK-HiuMaanNeural",
            ["zh-TW"]: "zh-TW-HsiaoChenNeural",
            ["zu-ZA"]: "zu-ZA-ThandoNeural",
        };

        let language = this.properties.getProperty(PropertyId.SpeechServiceConnection_SynthLanguage, "en-US");
        let voice = this.properties.getProperty(PropertyId.SpeechServiceConnection_SynthVoice, "");
        let ssml: string = SpeechSynthesizer.XMLEncode(text);
        if (this.autoDetectSourceLanguage) {
            language = "en-US";
        } else {
            voice = voice || languageToDefaultVoice[language];
        }
        if (voice) {
            ssml = `<voice name='${voice}'>${ssml}</voice>`;
        }
        ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xmlns:emo='http://www.w3.org/2009/10/emotionml' xml:lang='${language}'>${ssml}</speak>`;
        return ssml;
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

    /**
     * This method performs cleanup of resources.
     * The Boolean parameter disposing indicates whether the method is called
     * from Dispose (if disposing is true) or from the finalizer (if disposing is false).
     * Derived classes should override this method to dispose resource if needed.
     * @member SpeechSynthesizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - Flag to request disposal.
     */
    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposed) {
            return;
        }

        if (disposing) {
            if (this.privAdapter) {
                await this.privAdapter.dispose();
            }
        }

        this.privDisposed = true;
    }

    //
    // ################################################################################################################
    // IMPLEMENTATION.
    // Move to independent class
    // ################################################################################################################
    //
    protected createSynthesizerConfig(speechConfig: SpeechServiceConfig): SynthesizerConfig {
        return new SynthesizerConfig(
            speechConfig,
            this.privProperties);
    }

    // Creates the synthesis adapter
    protected createSynthesisAdapter(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        audioConfig: AudioConfig,
        synthesizerConfig: SynthesizerConfig): SynthesisAdapterBase {
        return new SynthesisAdapterBase(authentication, connectionFactory,
            synthesizerConfig, this, this.audioConfig as AudioOutputConfigImpl);
    }

    protected implCommonSynthesizeSetup(): void {

        let osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        let osName = "unknown";
        let osVersion = "unknown";

        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }

        const synthesizerConfig = this.createSynthesizerConfig(
            new SpeechServiceConfig(
                new Context(new OS(osPlatform, osName, osVersion))));

        const subscriptionKey = this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);
        const authentication = (subscriptionKey && subscriptionKey !== "") ?
            new CognitiveSubscriptionKeyAuthentication(subscriptionKey) :
            new CognitiveTokenAuthentication(
                (authFetchEventId: string): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                },
                (authFetchEventId: string): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                });

        this.privAdapter = this.createSynthesisAdapter(
            authentication,
            this.privConnectionFactory,
            this.audioConfig,
            synthesizerConfig);

        this.privAdapter.audioOutputFormat = AudioOutputFormatImpl.fromSpeechSynthesisOutputFormat(
            (SpeechSynthesisOutputFormat as any)[this.properties.getProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, undefined)]
        );

        this.privRestAdapter = new SynthesisRestAdapter(synthesizerConfig);
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
                            err(e);
                        }
                    }
                }
                cb = undefined;
                /* tslint:disable:no-empty */
                this.adapterSpeak().catch(() => { });

            }, (e: string): void => {
                if (!!err) {
                    err(e);
                }
            }, audioDestination));

            /* tslint:disable:no-empty */
            this.adapterSpeak().catch(() => { });

        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            // Destroy the synthesizer.
            /* tslint:disable:no-empty */
            this.dispose(true).catch(() => { });
        }
    }

    protected async getVoices(locale: string): Promise<SynthesisVoicesResult> {
        const requestId = createNoDashGuid();
        const response: IRestResponse = await this.privRestAdapter.getVoicesList(requestId);
        if (response.ok && Array.isArray(response.json)) {
            let json = response.json;
            if (!!locale && locale.length > 0) {
                json = json.filter((item: any) => !!item.Locale && item.Locale.toLowerCase() === locale.toLowerCase() );
            }
            return new SynthesisVoicesResult(requestId, json);
        } else {
            return new SynthesisVoicesResult(requestId, { errorDetails: `Error: ${response.status}: ${response.statusText}`});
        }
   }

    protected async adapterSpeak(): Promise<void> {
        if (!this.privDisposed && !this.privSynthesizing) {
            this.privSynthesizing = true;
            const request: SynthesisRequest = await this.synthesisRequestQueue.dequeue();
            return this.privAdapter.Speak(request.text, request.isSSML, request.requestId, request.cb, request.err, request.dataStream);
        }
    }

    private static XMLEncode(text: string): string {
        return text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }
}

// tslint:disable-next-line:max-classes-per-file
export class SynthesisRequest {
    public requestId: string;
    public text: string;
    public isSSML: boolean;
    public cb: (e: SpeechSynthesisResult) => void;
    public err: (e: string) => void;
    public dataStream: IAudioDestination;

    constructor(requestId: string, text: string, isSSML: boolean, cb?: (e: SpeechSynthesisResult) => void, err?: (e: string) => void, dataStream?: IAudioDestination) {
        this.requestId = requestId;
        this.text = text;
        this.isSSML = isSSML;
        this.cb = cb;
        this.err = err;
        this.dataStream = dataStream;
    }
}
