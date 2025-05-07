// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConfigLoader } from "./ConfigLoader";
import { SubscriptionsRegionsKeys } from "./SubscriptionRegion";

export class Settings {

    public static RetryCount: number = 3;
    // subscription
    public static SpeechSubscriptionKey: string = "<<YOUR_SUBSCRIPTION_KEY>>";
    public static SpeechRegion: string = "<<YOUR_REGION>>";
    public static SpeechEndpoint: string;

    public static VoiceSignatureEnrollmentEndpoint: string = "wss://10.91.185.105:8446/speech/voicesignature?&language=en-us";
    public static VoiceSignatureEnrollmentKey: string;

    public static SpeechTestEndpointId: string = "<<YOUR_TEST_ENDPOINT_ID>>";

    public static ConversationTranslatorSwedenEndpoint: string = "wss://transcribe.westus.cts.speech.microsoft.com/speech/recognition/dynamicaudio";

    // Endpoint and key for timeout testing.
    // Endpoint should reduce standard speech timeout to value specified in SpeechServiceTimeoutSeconds
    // If undefined, production timeout of 10 seconds will be used, but at the cost of greatly increased test
    // duration.
    public static SpeechTimeoutEndpoint: string;
    public static SpeechTimeoutKey: string;
    public static SpeechServiceTimeoutSeconds: number = 60 * 10; // 10 minutes

    public static LuisSubscriptionKey: string = "<<YOUR_LUIS_SUBSCRIPTION_KEY>>";
    public static LuisRegion: string = "<<YOUR_LUIS_REGION>>";
    public static LuisAppEndPointHref: string = "<<YOUR_LUIS_APP_URL>>";

    public static BotSecret: string = "<<YOUR_BOT_SECRET>>";
    public static BotSubscription: string = "<<YOUR_BOT_SUBSCRIPTION>>";
    public static BotRegion: string = "<<YOUR_BOT_REGION>>";

    public static SpeakerIDSubscriptionKey: string = "<<YOUR_SPEAKER_ID_SUBSCRIPTION_KEY>>";
    public static SpeakerIDRegion: string = "<<YOUR_SPEAKER_ID_REGION>>";
    public static ConversationTranscriptionKey: string = "<<YOUR_TRANSCRIPTION_SUBSCRIPTION_KEY>>";
    public static ConversationTranscriptionRegion: string = "<<YOUR_TRANSCRIPTION_REGION>>";

    public static CustomVoiceSubscriptionKey: string = "<<YOUR_CUSTOM_VOICE_SUBSCRIPTION_KEY>>";
    public static CustomVoiceRegion: string = "<<YOUR_CUSTOM_VOICE_REGION>>";

    public static InputDir: string = "tests/input/audio/";

    public static ExecuteLongRunningTests: string = "false";
    public static TestLogPath: string = "./TEST_LOG.txt";

    public static get ExecuteLongRunningTestsBool(): boolean {
        return "false" !== this.ExecuteLongRunningTests;
    }

    /*
     * The intent behind this setting is that at test execution time the WaveFile below will contain speech
     * that the LUIS app above will recognize as an intent with this ID.
     *
     * Since the default wave file asks "What's the weather like?", an intent with the Id of "Weather" seems reasonable.
     */
    public static LuisValidIntentId: string = "HomeAutomation.TurnOn";
    public static LuisAppKey: string;
    public static LuisWaveFileLanguage: string = "en-US";
    public static LuisWaveFile: string = Settings.InputDir + "TurnOnTheLamp.wav";
    public static LuisWavFileText: string = "Turn on the lamp.";
    public static LuisWaveFileDuration: number = 11000000;
    public static LuisWaveFileOffset: number = 4000000;

    // Currently the other bindings read the app key out of the shell environment setup by
    // $\ci\set-test-variables.sh and not a secret passed by VSTS. So the question isn't
    // should we set it in code, but where...
    public static LuisAppId: string = "b687b851-56c5-4d31-816f-35a741a3f0be";

    public static WaveFile: string = Settings.InputDir + "whatstheweatherlike.wav";
    public static WaveFile8ch: string = Settings.InputDir + "Speech016_30s_xmos_8ch.wav";
    public static WaveFile8ch2: string = Settings.InputDir + "katiesteve.wav";
    public static WaveFileSingleChannel: string = Settings.InputDir + "katiesteve_mono.wav";
    public static WaveFile44k: string = Settings.InputDir + "whatstheweatherlike.44khz.wav";
    public static WaveFileMulaw: string = Settings.InputDir + "whatstheweatherlike.mulaw";
    public static WaveFileAlaw: string = Settings.InputDir + "whatstheweatherlike.alaw";
    public static WaveFileDe: string = Settings.InputDir + "howistheweather.wav";
    public static LongerWaveFile: string = Settings.InputDir + "StreamingEnrollment.wav";
    public static LongGermanWaveFile: string = Settings.InputDir + "longer_german.wav";
    public static PronunciationFallWaveFile: string = Settings.InputDir + "PronunciationAssessmentFall.wav";
    public static MonoChannelAlignedWaveFile: string = Settings.InputDir + "only-a-test.wav";
    public static WaveFileLanguage: string = "en-US";
    public static WaveFileDuration: number = 12900000;
    public static WaveFileOffset: number = 1000000;
    public static WaveFileText: string = "What's the weather like?";

    // Available at https://glharper-js-test.azurewebsites.net/speechServiceOverview.zip
    public static EvenLongerWaveFile: string = Settings.InputDir + "speechServiceOverview.wav";

    public static AmbiguousWaveFile: string = Settings.InputDir + "wreck-a-nice-beach.wav";

    public static IndependentIdentificationWaveFile: string = Settings.InputDir + "english_activation_v3_p1.wav";
    public static DependentVerificationWaveFile: string = Settings.InputDir + "myVoiceIsMyPassportVerifyMe04.wav";
    public static VerificationWaveFiles: string[] = [
        Settings.InputDir + "myVoiceIsMyPassportVerifyMe01.wav",
        Settings.InputDir + "myVoiceIsMyPassportVerifyMe02.wav",
        Settings.InputDir + "myVoiceIsMyPassportVerifyMe03.wav",
    ];

    public static ConversationTranslatorHost: string = "";
    public static ConversationTranslatorSpeechHost: string = "";

    public static proxyServer: string;
    public static proxyPort: number;

    private static IsSettingsInitialized: boolean = false;
    public static SettingsClassLock: Settings;

    public static CustomVoiceEndpointId: string = "8d4cf211-8602-40b7-833c-56a2f1060f89";
    public static CustomVoiceVoiceName: string = "carbonTestNeural";
    public static testIfDOMCondition: jest.It = (typeof window === "undefined") ? test.skip : test;
    public static testIfNode: jest.It = (typeof window !== "undefined") ? test.skip : test;

    public static initialize(): void {
        Settings.SettingsClassLock = new Settings();

        Settings.LoadSettings();
    }

    public static LoadSettings(): void {
        if (Settings.IsSettingsInitialized) {
            return;
        }

        // Initialize the config loader to load the secrets and endpoints
        const configLoader = ConfigLoader.instance;
        const initialized = configLoader.initialize();

        if (initialized) {
            // Load the unified speech subscription
            const unifiedSpeechSub = configLoader.getSubscriptionRegion(SubscriptionsRegionsKeys.UNIFIED_SPEECH_SUBSCRIPTION);
            if (unifiedSpeechSub) {
                Settings.SpeechSubscriptionKey = unifiedSpeechSub.Key;
                Settings.SpeechRegion = unifiedSpeechSub.Region;
                /* Skip for now until endpoing is fully supported
                if (unifiedSpeechSub.Endpoint) {
                    Settings.SpeechEndpoint = unifiedSpeechSub.Endpoint;
                }
                */
            }

            // Load the LUIS subscription
            const luisSub = configLoader.getSubscriptionRegion(SubscriptionsRegionsKeys.LUIS_SUBSCRIPTION);
            if (luisSub) {
                Settings.LuisSubscriptionKey = luisSub.Key;
                Settings.LuisRegion = luisSub.Region;
            }

            // Load the speaker recognition subscription
            const speakerIdSub = configLoader.getSubscriptionRegion(SubscriptionsRegionsKeys.SPEAKER_RECOGNITION_SUBSCRIPTION);
            if (speakerIdSub) {
                Settings.SpeakerIDSubscriptionKey = speakerIdSub.Key;
                Settings.SpeakerIDRegion = speakerIdSub.Region;
            }

            // Load the conversation transcription subscription
            const conversationTranscriptionSub = configLoader.getSubscriptionRegion(
                SubscriptionsRegionsKeys.CONVERSATION_TRANSCRIPTION_SUBSCRIPTION);
            if (conversationTranscriptionSub) {
                Settings.ConversationTranscriptionKey = conversationTranscriptionSub.Key;
                Settings.ConversationTranscriptionRegion = conversationTranscriptionSub.Region;
            }

            // Load the custom voice subscription
            const customVoiceSub = configLoader.getSubscriptionRegion(SubscriptionsRegionsKeys.CUSTOM_VOICE_SUBSCRIPTION);
            if (customVoiceSub) {
                Settings.CustomVoiceSubscriptionKey = customVoiceSub.Key;
                Settings.CustomVoiceRegion = customVoiceSub.Region;
            }

            // Load the conversation translator settings
            const conversationTranslatorSub = configLoader.getSubscriptionRegion(SubscriptionsRegionsKeys.CONVERSATION_TRANSLATOR);
            if (conversationTranslatorSub) {
                // These might be set from other configuration values
                // but we'll use the region and key if available
            }

            const botSub = configLoader.getSubscriptionRegion(SubscriptionsRegionsKeys.DIALOG_SUBSCRIPTION);
            if (botSub) {
                Settings.BotSubscription = botSub.Key;
                Settings.BotRegion = botSub.Region;
            }
        }

        if (undefined === Settings.LuisAppKey) {
            Settings.LuisAppKey = Settings.LuisSubscriptionKey;
        }

        Settings.IsSettingsInitialized = true;
    }
}
Settings.initialize();
