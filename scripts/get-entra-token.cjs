#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
//
// Prints a Microsoft Entra ID access token for the Cognitive Services scope as JSON
// ({ "token": "...", "expiresOnTimestamp": <ms> }) on stdout. The tests call this script synchronously
// (tests/EntraAuth.ts), because most tests build their speech config synchronously.
//
// Credential: workload identity federation (AzurePipelinesCredential) when SERVICE_APP_ID,
// SERVICE_CONNECTION_ID and SYSTEM_ACCESSTOKEN are set (Azure Pipelines), otherwise DefaultAzureCredential
// (for example, Azure CLI sign-in on a developer machine).
// Usage: node scripts/get-entra-token.cjs <tenantId>

const { AzurePipelinesCredential, DefaultAzureCredential } = require("@azure/identity");

const scope = "https://cognitiveservices.azure.com/.default";

async function main() {
    const tenantId = process.env.SERVICE_TENANT_ID || process.argv[2];
    const clientId = process.env.SERVICE_APP_ID;
    const serviceConnectionId = process.env.SERVICE_CONNECTION_ID;
    const systemAccessToken = process.env.SYSTEM_ACCESSTOKEN;

    let credential;
    if (tenantId && clientId && serviceConnectionId && systemAccessToken) {
        credential = new AzurePipelinesCredential(tenantId, clientId, serviceConnectionId, systemAccessToken);
        process.stderr.write("Microsoft Entra ID credential: AzurePipelinesCredential (workload identity federation)\n");
    } else {
        credential = new DefaultAzureCredential();
        process.stderr.write("Microsoft Entra ID credential: DefaultAzureCredential (fallback)\n");
    }

    const accessToken = await credential.getToken(scope);
    if (!accessToken || !accessToken.token) {
        throw new Error("No Microsoft Entra ID access token for " + scope);
    }

    process.stdout.write(JSON.stringify({ expiresOnTimestamp: accessToken.expiresOnTimestamp, token: accessToken.token }));
}

main().catch((error) => {
    process.stderr.write("Failed to get a Microsoft Entra ID access token: " + (error && error.message ? error.message : String(error)) + "\n");
    process.exit(1);
});
