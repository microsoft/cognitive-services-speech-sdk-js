// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Represents a subscription and region configuration matching the C# format.
 */
export interface SubscriptionRegion {
    /**
     * The subscription key.
     */
    Key: string;

    /**
     * The region for the subscription.
     */
    Region: string;

    /**
     * The endpoint URL (optional).
     */
    Endpoint?: string;

    /**
     * The Azure resource ID (optional).
     */
    ResourceId?: string;

    /**
     * Optional description.
     */
    Description?: string;

    /**
     * Optional secret value.
     */
    Secret?: string;
}

/**
 * Keys for the standard subscription regions in the configuration.
 */
export class SubscriptionsRegionsKeys {
    public static readonly UNIFIED_SPEECH_SUBSCRIPTION: string = "UnifiedSpeechSubscription";
    public static readonly LUIS_SUBSCRIPTION: string = "LanguageUnderstandingSubscription";
    public static readonly SPEAKER_RECOGNITION_SUBSCRIPTION: string = "SpeakerRecognitionSubscription";
    public static readonly CONVERSATION_TRANSCRIPTION_SUBSCRIPTION: string = "ConversationTranscriptionPrincetonSubscription";
    public static readonly CUSTOM_VOICE_SUBSCRIPTION: string = "CustomVoiceSubscription";
    public static readonly DIALOG_SUBSCRIPTION: string = "DialogSubscription";
    public static readonly CONVERSATION_TRANSLATOR: string = "ConversationTranslatorSubscription";
    public static readonly AAD_SPEECH_CLIENT_SECRET: string = "AADSpeechClientSecret";
    public static readonly CUSTOM_VOICE_REGION: string = "CustomVoiceRegion";
}