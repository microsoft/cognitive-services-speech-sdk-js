// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as http from "http";
import * as tls from "tls";
import * as net from "net";
import * as parse from "url-parse";
import Agent from "agent-base";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Cache from "async-disk-cache";

import HttpsProxyAgent from "https-proxy-agent";
import { OCSPCacheUpdateErrorEvent } from "../common/OCSPEvents";
import {
    Events,
    OCSPCacheEntryExpiredEvent,
    OCSPCacheEntryNeedsRefreshEvent,
    OCSPCacheFetchErrorEvent,
    OCSPCacheHitEvent,
    OCSPCacheMissEvent,
    OCSPCacheUpdateCompleteEvent,
    OCSPCacheUpdateNeededEvent,
    OCSPDiskCacheHitEvent,
    OCSPDiskCacheStoreEvent,
    OCSPEvent,
    OCSPMemoryCacheHitEvent,
    OCSPMemoryCacheStoreEvent,
    OCSPResponseRetrievedEvent,
    OCSPStapleReceivedEvent,
    OCSPVerificationFailedEvent,
} from "../common/Exports";
import { IStringDictionary } from "../common/IDictionary";
import * as ocsp from "../../external/ocsp/ocsp";
import { ProxyInfo } from "./ProxyInfo";

interface tbsUpdateResponse {
    thisUpdate: number;
    nextUpdate: number;
}

interface tbsResponse {
    tbsResponseData: {
        responses: tbsUpdateResponse[];
    };
}

export class CertCheckAgent {

    // Test hook to enable forcing expiration / refresh to happen.
    public static testTimeOffset: number = 0;

    // Test hook to disable stapling for cache testing.
    public static forceDisableOCSPStapling: boolean = false;

    // An in memory cache for recived responses.
    private static privMemCache: IStringDictionary<Buffer> = {};

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

    // Test hook to force the disk cache to be recreated.
    public static forceReinitDiskCache(): void {
        CertCheckAgent.privDiskCache = undefined;
        CertCheckAgent.privMemCache = {};
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public GetAgent(disableStapling?: boolean): http.Agent {
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

    private static async OCSPCheck(socketPromise: Promise<net.Socket>, proxyInfo: ProxyInfo): Promise<net.Socket> {
        let ocspRequest: ocsp.Request;
        let stapling: Buffer;
        let resolved: boolean = false;

        const socket: net.Socket = await socketPromise;
        socket.cork();

        const tlsSocket: tls.TLSSocket = socket as tls.TLSSocket;

        return new Promise<net.Socket>((resolve: (value: net.Socket) => void, reject: (error: string | Error) => void): void => {
            socket.on("OCSPResponse", (data: Buffer): void => {
                if (!!data) {
                    this.onEvent(new OCSPStapleReceivedEvent());
                    stapling = data;
                }
            });

            socket.on("error", (error: Error): void => {
                if (!resolved) {
                    resolved = true;
                    socket.destroy();
                    reject(error);
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/explicit-function-return-type
            tlsSocket.on("secure", async () => {
                const peer: tls.DetailedPeerCertificate = tlsSocket.getPeerCertificate(true);
                try {
                    const issuer: tls.DetailedPeerCertificate = await this.GetIssuer(peer);

                    // We always need a request to verify the response.
                    ocspRequest = ocsp.request.generate(peer.raw, issuer.raw);

                    // Do we have a result for this certificate in our memory cache?
                    const sig: string = ocspRequest.id.toString("hex");

                    // Stapled response trumps cached response.
                    if (!stapling) {
                        const cacheEntry: Buffer = await CertCheckAgent.GetResponseFromCache(sig, ocspRequest, proxyInfo);
                        stapling = cacheEntry;
                    }

                    await this.VerifyOCSPResponse(stapling, ocspRequest, proxyInfo);

                    socket.uncork();
                    resolved = true;
                    resolve(socket);
                } catch (e) {
                    socket.destroy();
                    resolved = true;
                    reject(e as string);
                }
            });
        });
    }

    private static GetIssuer(peer: tls.DetailedPeerCertificate): Promise<tls.DetailedPeerCertificate> {
        if (peer.issuerCertificate) {
            return Promise.resolve(peer.issuerCertificate);
        }

        return new Promise<tls.DetailedPeerCertificate>((resolve: (value: tls.DetailedPeerCertificate) => void, reject: (reason: string) => void): void => {
            const ocspAgent: ocsp.Agent = new ocsp.Agent({});
            ocspAgent.fetchIssuer(peer, null, (error: string, value: tls.DetailedPeerCertificate): void => {
                if (!!error) {
                    reject(error);
                    return;
                }

                resolve(value);
            });
        });
    }

    private static async GetResponseFromCache(signature: string, ocspRequest: ocsp.Request, proxyInfo: ProxyInfo): Promise<Buffer> {
        let cachedResponse: Buffer = CertCheckAgent.privMemCache[signature];

        if (!!cachedResponse) {
            this.onEvent(new OCSPMemoryCacheHitEvent(signature));
        }

        // Do we have a result for this certificate on disk in %TMP%?
        if (!cachedResponse) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const diskCacheResponse: { value: Buffer; isCached?: any } = await CertCheckAgent.privDiskCache.get(signature) as { value: Buffer; isCached?: any };
                if (!!diskCacheResponse.isCached) {
                    CertCheckAgent.onEvent(new OCSPDiskCacheHitEvent(signature));
                    CertCheckAgent.StoreMemoryCacheEntry(signature, diskCacheResponse.value);
                    cachedResponse = diskCacheResponse.value;
                }
            } catch (error) {
                cachedResponse = null;
            }
        }

        if (!cachedResponse) {
            return cachedResponse;
        }

        try {
            const cachedOcspResponse: ocsp.Response = ocsp.utils.parseResponse(cachedResponse);
            const responseValue: tbsResponse = cachedOcspResponse.value as tbsResponse;
            const tbsData: { responses: tbsUpdateResponse[] } = responseValue.tbsResponseData;
            if (tbsData.responses.length < 1) {
                this.onEvent(new OCSPCacheFetchErrorEvent(signature, "Not enough data in cached response"));
                return;
            }

            const cachedStartTime: number = tbsData.responses[0].thisUpdate;
            const cachedNextTime: number = tbsData.responses[0].nextUpdate;

            if (cachedNextTime < (Date.now() + this.testTimeOffset - 60000)) {
                // Cached entry has expired.
                this.onEvent(new OCSPCacheEntryExpiredEvent(signature, cachedNextTime));
                cachedResponse = null;
            } else {
                // If we're within one day of the next update, or 50% of the way through the validity period,
                // background an update to the cache.

                const minUpdate: number = Math.min(24 * 60 * 60 * 1000, (cachedNextTime - cachedStartTime) / 2);

                if ((cachedNextTime - (Date.now() + this.testTimeOffset)) < minUpdate) {
                    this.onEvent(new OCSPCacheEntryNeedsRefreshEvent(signature, cachedStartTime, cachedNextTime));
                    this.UpdateCache(ocspRequest, proxyInfo).catch((error: string): void => {
                        // Well, not much we can do here.
                        this.onEvent(new OCSPCacheUpdateErrorEvent(signature, error.toString()));
                    });
                } else {
                    this.onEvent(new OCSPCacheHitEvent(signature, cachedStartTime, cachedNextTime));
                }
            }
        } catch (error) {
            this.onEvent(new OCSPCacheFetchErrorEvent(signature, error as string));
            cachedResponse = null;
        }
        if (!cachedResponse) {
            this.onEvent(new OCSPCacheMissEvent(signature));
        }
        return cachedResponse;
    }

    private static async VerifyOCSPResponse(cacheValue: Buffer, ocspRequest: ocsp.Request, proxyInfo: ProxyInfo): Promise<void> {
        let ocspResponse: Buffer = cacheValue;

        // Do we have a valid response?
        if (!ocspResponse) {
            ocspResponse = await CertCheckAgent.GetOCSPResponse(ocspRequest, proxyInfo);
        }

        return new Promise<void>((resolve: () => void, reject: (error: string | Error) => void): void => {
            ocsp.verify({ request: ocspRequest, response: ocspResponse }, (error: string): void => {
                if (!!error) {
                    CertCheckAgent.onEvent(new OCSPVerificationFailedEvent(ocspRequest.id.toString("hex"), error));

                    // Bad Cached Value? One more try without the cache.
                    if (!!cacheValue) {
                        this.VerifyOCSPResponse(null, ocspRequest, proxyInfo).then((): void => {
                            resolve();
                        }, (error: Error): void => {
                            reject(error);
                        });
                    } else {
                        reject(error);
                    }
                } else {
                    if (!cacheValue) {
                        CertCheckAgent.StoreCacheEntry(ocspRequest.id.toString("hex"), ocspResponse);
                    }
                    resolve();
                }
            });
        });
    }

    private static async UpdateCache(req: ocsp.Request, proxyInfo: ProxyInfo): Promise<void> {
        const signature: string = req.id.toString("hex");
        this.onEvent(new OCSPCacheUpdateNeededEvent(signature));

        const rawResponse: Buffer = await this.GetOCSPResponse(req, proxyInfo);
        this.StoreCacheEntry(signature, rawResponse);
        this.onEvent(new OCSPCacheUpdateCompleteEvent(req.id.toString("hex")));

    }

    private static StoreCacheEntry(sig: string, rawResponse: Buffer): void {
        this.StoreMemoryCacheEntry(sig, rawResponse);
        this.StoreDiskCacheEntry(sig, rawResponse);
    }

    private static StoreMemoryCacheEntry(sig: string, rawResponse: Buffer): void {
        this.privMemCache[sig] = rawResponse;
        this.onEvent(new OCSPMemoryCacheStoreEvent(sig));
    }

    private static StoreDiskCacheEntry(sig: string, rawResponse: Buffer): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        this.privDiskCache.set(sig, rawResponse).then((): void => {
            this.onEvent(new OCSPDiskCacheStoreEvent(sig));
        });
    }

    private static GetOCSPResponse(req: ocsp.Request, proxyInfo: ProxyInfo): Promise<Buffer> {

        const ocspMethod: string = "1.3.6.1.5.5.7.48.1";
        let options: http.RequestOptions = {};

        if (!!proxyInfo) {
            const agent: HttpsProxyAgent = CertCheckAgent.GetProxyAgent(proxyInfo);
            options.agent = agent;
        }

        return new Promise<Buffer>((resolve: (value: Buffer) => void, reject: (error: string | Error) => void): void => {
            ocsp.utils.getAuthorityInfo(req.cert as tls.DetailedPeerCertificate, ocspMethod, (error: string, uri: string): void => {
                if (error) {
                    reject(error);
                    return;
                }

                const parsedUri: {[k: string]: any} = parse.default(uri);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                parsedUri.path = parsedUri.pathname;
                options = { ...options, ...parsedUri };

                ocsp.utils.getResponse(options, req.data, (error: string, raw: Buffer): void => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    const certID: Buffer = req.certID as Buffer;
                    this.onEvent(new OCSPResponseRetrievedEvent(certID.toString("hex")));
                    resolve(raw);
                });
            });
        });
    }

    private static onEvent(event: OCSPEvent): void {
        Events.instance.onEvent(event);
    }

    private CreateConnection(request: Agent.ClientRequest, options: Agent.RequestOptions): Promise<net.Socket> {
        const enableOCSP: boolean = (typeof process !== "undefined" && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0" && process.env.SPEECH_CONDUCT_OCSP_CHECK !== "0") && options.secureEndpoint;
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

        if (!!enableOCSP) {
            return CertCheckAgent.OCSPCheck(socketPromise, this.privProxyInfo);
        } else {
            return socketPromise;
        }
    }
}
