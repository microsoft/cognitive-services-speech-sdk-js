/* eslint-disable @typescript-eslint/no-unused-vars */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { AgentConfig } from "./src/common.speech/Exports.js";

// Note: this instantiation ensures the above import isn't
// removed on compile. The import being absent causes an error on running
void new AgentConfig();

// Speech SDK API
export * from "./src/sdk/Exports.js";
