// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IConnection } from "../common/Exports.js";
import { AuthInfo } from "./IAuthentication.js";
import { SynthesizerConfig } from "./SynthesizerConfig.js";

export interface ISynthesisConnectionFactory {
    create(
        config: SynthesizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): Promise<IConnection>;
}
