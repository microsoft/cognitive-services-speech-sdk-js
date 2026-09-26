// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as net from "net";
import type { RecognizerConfig } from "../common.speech/RecognizerConfig.js";
import type { PropertyCollection } from "../sdk/PropertyCollection.js";
import { PropertyId } from "../sdk/PropertyId.js";

export class ProxyInfo {
    private privProxyHostName: string;
    private privProxyPort: number;
    private privProxyUserName: string;
    private privProxyPassword: string;
    private privEnableIpv6: boolean;

    private constructor(proxyHostName: string, proxyPort: number, proxyUserName: string, proxyPassword: string, enableIpv6: boolean) {
        this.privProxyHostName = proxyHostName;
        this.privProxyPort = proxyPort;
        this.privProxyUserName = proxyUserName;
        this.privProxyPassword = proxyPassword;
        this.privEnableIpv6 = enableIpv6;
    }

    public static fromParameters(parameters: Pick<PropertyCollection, "getProperty">): ProxyInfo {
        return new ProxyInfo(parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyHostName),
            parseInt(parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyPort), 10),
            parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyUserName),
            parameters.getProperty(PropertyId.SpeechServiceConnection_ProxyPassword),
            parameters.getProperty(PropertyId.SpeechServiceConnection_EnableIpv6, "false") === "true");
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

    public get EnableIpv6(): boolean {
        return this.privEnableIpv6;
    }

    public get IsConfigured(): boolean {
        return this.privProxyHostName !== undefined && this.privProxyPort > 0;
    }

    public get IsIpv6Host(): boolean {
        const host: string = this.privProxyHostName?.replace(/^\[|\]$/g, "").split("%")[0];
        return net.isIPv6(host);
    }

    public get Url(): URL {
        const proxyHost: string = this.privProxyHostName.includes(":") && !this.privProxyHostName.startsWith("[")
            ? `[${this.privProxyHostName}]`
            : this.privProxyHostName;
        const proxyUrl = new URL(`http://${proxyHost}:${this.privProxyPort}`);
        if (!!this.privProxyUserName) {
            const proxyPassword: string = this.privProxyPassword === undefined ? "" : this.privProxyPassword;
            proxyUrl.username = encodeURIComponent(this.privProxyUserName);
            proxyUrl.password = encodeURIComponent(proxyPassword);
        }
        return proxyUrl;
    }
}
