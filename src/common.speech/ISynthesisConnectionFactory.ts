// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IConnection } from "../common/Exports";
import { AuthInfo } from "./IAuthentication";
import { SynthesizerConfig } from "./SynthesizerConfig";

export interface ISynthesisConnectionFactory {
    create(
        config: SynthesizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection;
}
