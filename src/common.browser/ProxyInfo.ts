// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { RecognizerConfig } from "../common.speech/Exports.js";
import { PropertyCollection, PropertyId } from "../sdk/Exports.js";

export class ProxyInfo {
    private privProxyHostName: string;
    private privProxyPort: number;
    private privProxyUserName: string;
    private privProxyPassword: string;

    private constructor(proxyHostName: string, proxyPort: number, proxyUserName: string, proxyPassword: string) {
        this.privProxyHostName = proxyHostName;
        this.privProxyPort = proxyPort;
        this.privProxyUserName = proxyUserName;
        this.privProxyPassword = proxyPassword;
    }

    public static fromParameters(parameters: PropertyCollection): ProxyInfo {
        return new ProxyInfo(parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyHostName),
            parseInt(parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyPort), 10),
            parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyUserName),
            parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyPassword));
    }

    public static fromRecognizerConfig(config: RecognizerConfig): ProxyInfo {
        return this.fromParameters(config.parameters);
    }

    public get HostName(): string {
        return this.privProxyHostName;
    }

    public get Port(): number {
        return this.privProxyPort;
    }

    public get UserName(): string {
        return this.privProxyUserName;
    }

    public get Password(): string {
        return this.privProxyPassword;
    }
}
