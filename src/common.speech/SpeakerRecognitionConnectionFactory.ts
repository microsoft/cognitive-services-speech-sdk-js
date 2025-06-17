// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports.js";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports.js";
import {
    PropertyId
} from "../sdk/Exports.js";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase.js";
import {
    AuthInfo,
    RecognizerConfig,
    WebsocketMessageFormatter,
} from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";

class SpeakerRecognitionConnectionFactoryBase extends ConnectionFactoryBase {

    public create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        endpointPath: string,
        connectionId?: string): Promise<IConnection> {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint);
        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region);
            const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
            const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, `wss://${region}.spr-frontend.speech${hostSuffix}`);
            const scenario: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_SpeakerIdMode, "TextIndependentIdentification");
            endpoint = `${host}/speaker/ws/${this.scenarioToPath(scenario)}/${endpointPath}`;
        }

        const queryParams: IStringDictionary<string> = {
            format: "simple",
            language: config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage),
        };

        this.setCommonUrlParams(config, queryParams, endpoint);

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;
        headers[HeaderNames.SpIDAuthKey] = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Key);

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return Promise.resolve(new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId));
    }

    private scenarioToPath(mode: string): string {
        switch (mode) {
            case "TextIndependentVerification":
            case "2":
                return "verification/text-independent";
            case "TextDependentVerification":
            case "1":
                return "verification/text-dependent";
            default:
                return "identification/text-independent";
        }
    }
}

export class SpeakerRecognitionConnectionFactory extends SpeakerRecognitionConnectionFactoryBase {
    public create(config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string): Promise<IConnection> {
        return super.create(config, authInfo, "recognition", connectionId);
    }
}

export class VoiceProfileConnectionFactory extends SpeakerRecognitionConnectionFactoryBase {
    public create(config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string): Promise<IConnection> {
        return super.create(config, authInfo, "profile", connectionId);
    }
}

