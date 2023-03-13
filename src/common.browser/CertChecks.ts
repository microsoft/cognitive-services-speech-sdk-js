/* eslint-disable import/order */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as http from "http";
import * as tls from "tls";
import { ProxyInfo } from "./ProxyInfo";

import Agent from "agent-base";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Cache from "async-disk-cache";
import HttpsProxyAgent from "https-proxy-agent";
import * as net from "net";

export class CertCheckAgent {

    // Test hook to enable forcing expiration / refresh to happen.
    public static testTimeOffset: number = 0;

    // Test hook to disable stapling for cache testing.
    public static forceDisableOCSPStapling: boolean = false;

    // The on disk cache.
    private static privDiskCache: Cache;

    private privProxyInfo: ProxyInfo;

    public constructor(proxyInfo?: ProxyInfo) {
        if (!!proxyInfo) {
            this.privProxyInfo = proxyInfo;
        }

        // Initialize this here to allow tests to set the env variable before the cache is constructed.
        if (!CertCheckAgent.privDiskCache) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            CertCheckAgent.privDiskCache = new Cache("microsoft-cognitiveservices-speech-sdk-cache", { supportBuffer: true, location: (typeof process !== "undefined" && !!process.env.SPEECH_OCSP_CACHE_ROOT) ? process.env.SPEECH_OCSP_CACHE_ROOT : undefined });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public GetAgent(): http.Agent {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const agent: any = new Agent.Agent(this.CreateConnection);

        if (this.privProxyInfo !== undefined &&
            this.privProxyInfo.HostName !== undefined &&
            this.privProxyInfo.Port > 0) {
            const proxyName: string = "privProxyInfo";
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            agent[proxyName] = this.privProxyInfo;
        }

        return agent as http.Agent;
    }

    private static GetProxyAgent(proxyInfo: ProxyInfo): HttpsProxyAgent {
        const httpProxyOptions: HttpsProxyAgent.HttpsProxyAgentOptions = {
            host: proxyInfo.HostName,
            port: proxyInfo.Port,
        };

        if (!!proxyInfo.UserName) {
            httpProxyOptions.headers = {
                "Proxy-Authentication": "Basic " + new Buffer(`${proxyInfo.UserName}:${(proxyInfo.Password === undefined) ? "" : proxyInfo.Password}`).toString("base64"),
            };
        } else {
            httpProxyOptions.headers = {};
        }

        httpProxyOptions.headers.requestOCSP = "true";

        const httpProxyAgent: HttpsProxyAgent = new HttpsProxyAgent(httpProxyOptions);
        return httpProxyAgent;
    }

    private CreateConnection(request: Agent.ClientRequest, options: Agent.RequestOptions): Promise<net.Socket> {
        let socketPromise: Promise<net.Socket>;

        options = {
            ...options,
            ...{
                requestOCSP: !CertCheckAgent.forceDisableOCSPStapling,
                servername: options.host
            }
        };

        if (!!this.privProxyInfo) {
            const httpProxyAgent: HttpsProxyAgent = CertCheckAgent.GetProxyAgent(this.privProxyInfo);
            const baseAgent: Agent.Agent = httpProxyAgent as unknown as Agent.Agent;

            socketPromise = new Promise<net.Socket>((resolve: (value: net.Socket) => void, reject: (error: string | Error) => void): void => {
                baseAgent.callback(request, options, (error: Error, socket: net.Socket): void => {
                    if (!!error) {
                        reject(error);
                    } else {
                        resolve(socket);
                    }
                });
            });
        } else {
            if (!!options.secureEndpoint) {
                socketPromise = Promise.resolve(tls.connect(options));
            } else {
                socketPromise = Promise.resolve(net.connect(options));
            }
        }

        return socketPromise;
    }
}
