# TypeScript Test Configuration

This document describes how to set up the test configuration for the Cognitive Services Speech SDK TypeScript/JavaScript tests.

## Configuration System

The test configuration uses a file-based approach to store authentication and endpoint information. The configuration system reads information from these JSON files:

- `test.subscriptions.regions.json` - Contains API keys, regions, and endpoints
- Settings.ts: Contains general rarely changed test configurations.

## Setting Up the Configuration

### Secrets and Endpoints

Create a file named `test.subscriptions.regions.json` with the following structure:

```json
{
  "UnifiedSpeechSubscription": {
    "Key": "your-speech-subscription-key",
    "Region": "your-region",
    "Endpoint": "https://your-region.api.cognitive.microsoft.com/"
  },
  "LanguageUnderstandingSubscription": {
    "Key": "your-luis-subscription-key",
    "Region": "your-region"
  },
  "SpeakerRecognitionSubscription": {
    "Key": "your-speaker-id-key",
    "Region": "your-region"
  },
  "ConversationTranscriptionPrincetonSubscription": {
    "Key": "your-transcription-key",
    "Region": "your-region"
  },
  "CustomVoiceSubscription": {
    "Key": "your-custom-voice-key",
    "Region": "your-region"
  }
}
```

The configuration loader will search for this file in the current directory and parent directories.

## How It Works

During initialization, the test framework will:

1. Load the JSON configuration file
2. Extract the relevant keys, regions, and endpoints
3. Populate the Settings class with these values

All tests will then use the values from the Settings class.

## Adding New Configuration Values

To add new subscription or region values:

1. Add the key name to the `SubscriptionsRegionsKeys` class in `SubscriptionRegion.ts`
2. Update the loading logic in `Settings.ts` if needed
3. Add the entry to your `test.subscriptions.regions.json` file