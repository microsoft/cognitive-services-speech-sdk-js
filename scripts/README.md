# Test Scripts Documentation

This folder contains scripts to help run different test configurations for the Speech SDK.

## Connection Type Tests

The Speech SDK tests include tests that verify different connection types using the `SpeechConnectionType` enum. These tests are controlled by the `RUN_CONNECTION_TYPE_TESTS` environment variable and are identifiable by their "Connection Tests" describe block names.

### Available Scripts

1. **Run Connection Type Tests Only**
   - **Linux/Mac**: `./scripts/run-connection-tests.sh`
   - **Windows**: `.\scripts\run-connection-tests.ps1`
   - **npm**: `npm run test:connection`

   This runs only the connection type tests by:
   - Setting the `RUN_CONNECTION_TYPE_TESTS` environment variable to `true` to enable these tests
   - Using Jest's `--testNamePattern="Connection Tests"` to filter for tests with "Connection Tests" in their describe blocks

2. **Run All Non-Connection Type Tests**
   - **Linux/Mac**: `./scripts/run-non-connection-tests.sh`
   - **Windows**: `.\scripts\run-non-connection-tests.ps1`
   - **npm**: `npm run test:non-connection`

   This runs all tests except the connection type tests by:
   - Setting `RUN_CONNECTION_TYPE_TESTS` to `false` (though this isn't strictly necessary given the filter)
   - Using Jest's `--testNamePattern` with a regex that excludes any tests with "Connection Tests" in their describe blocks

## How This Works

The solution combines two filtering mechanisms:

1. **Environment Variable Filtering**:
   - The `SpeechConfigConnectionFactory.runConnectionTest()` method in `SpeechConfigConnectionFactories.ts` checks the `RUN_CONNECTION_TYPE_TESTS` environment variable.
   - When this variable is not `true`, connection type tests are skipped.

2. **Jest Name Pattern Filtering**:
   - We use Jest's built-in filtering capabilities to focus on or exclude tests based on their describe block names.
   - Connection type tests are identifiable by having "Connection Tests" in their describe blocks.

This two-level filtering ensures that:
- When running connection tests, only those tests run and other tests are excluded
- When running non-connection tests, the connection tests are completely excluded

## Additional Notes

- Some connection type tests require additional environment variables to be set, such as:
  - `SR_CONTAINER_URL`, `LID_CONTAINER_URL`, and `TTS_CONTAINER_URL` for container tests
  - `RUN_PRIVAETE_LINK_TESTS` for private link tests

- Make sure you have all necessary credentials and environment variables set up before running these tests.

- The test filtering is based on the naming conventions in the test files, so if those conventions change, the filters may need to be updated.