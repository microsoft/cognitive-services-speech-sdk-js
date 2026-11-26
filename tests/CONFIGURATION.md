# TypeScript Test Configuration

This document describes how to set up the test configuration for the Cognitive Services Speech SDK TypeScript/JavaScript tests.

## Configuration System

The test configuration uses a file-based approach to store authentication and endpoint information. The configuration system reads information from these JSON files:

- `test.subscriptions.regions.json` - Contains regions, endpoints, resource IDs, and (optional) API keys
- Settings.ts: Contains general rarely changed test configurations.

## Authentication

The tests connect with Microsoft Entra ID, not with subscription keys: local (key) authentication is off on the
Speech resources that the tests use. `EntraAuth.ts` gets an access token for the scope
`https://cognitiveservices.azure.com/.default` and uses the speech token format `aad#<ResourceId>#<accessToken>`.

- Azure Pipelines: workload identity federation (`AzurePipelinesCredential`) with the service connection
  `Speedme-Dev-Carbon`. `ci/generate-subscription-file.yml` sets `SERVICE_APP_ID`, `SERVICE_TENANT_ID`, and
  `SERVICE_CONNECTION_ID`; the test step maps `SYSTEM_ACCESSTOKEN`.
- Local runs: `DefaultAzureCredential`, for example after `az login`. Your account needs the role
  **Cognitive Services Speech User** on the resources.

Each entry that the tests connect to needs a `ResourceId`. The `Key` can be empty. Tests of the key APIs
(subscription key, key credential, token from key, containers) run only when the unified Speech resource has a key.

## Setting Up the Configuration

### Secrets and Endpoints

Create a file named `test.subscriptions.regions.json` with the following structure:

```json
{
  "UnifiedSpeechSubscription": {
    "Key": "",
    "Region": "your-region",
    "Endpoint": "https://your-resource.cognitiveservices.azure.com/",
    "ResourceId": "/subscriptions/.../resourceGroups/.../providers/Microsoft.CognitiveServices/accounts/your-resource"
  },
  "ConversationTranscriptionPrincetonSubscription": {
    "Key": "",
    "Region": "your-region",
    "ResourceId": "..."
  },
  "CustomVoiceSubscription": {
    "Key": "",
    "Region": "your-region",
    "ResourceId": "..."
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