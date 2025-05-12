// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Node.JS specific web socket / browser support.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import * as http from "http";
import * as net from "net";
import * as tls from "tls";
import Agent from "agent-base";
import HttpsProxyAgent from "https-proxy-agent";

import ws from "ws";
import { HeaderNames } from "../common.speech/HeaderNames.js";
import {
    ArgumentNullError,
    BackgroundEvent,
    ConnectionClosedEvent,
    ConnectionErrorEvent,
    ConnectionEstablishedEvent,
    ConnectionEvent,
    ConnectionMessage,
    ConnectionMessageReceivedEvent,
    ConnectionMessageSentEvent,
    ConnectionOpenResponse,
    ConnectionRedirectEvent,
    ConnectionStartEvent,
    ConnectionState,
    Deferred,
    Events,
    EventSource,
    IWebsocketMessageFormatter,
    MessageType,
    Queue,
    RawWebsocketMessage,
} from "../common/Exports.js";
import { ProxyInfo } from "./ProxyInfo.js";

interface ISendItem {
    Message: ConnectionMessage;
    RawWebsocketMessage: RawWebsocketMessage;
    sendStatusDeferral: Deferred<void>;
}

export class WebsocketMessageAdapter {
    private privConnectionState: ConnectionState;
    private privMessageFormatter: IWebsocketMessageFormatter;
    private privWebsocketClient: WebSocket | ws;

    private privSendMessageQueue: Queue<ISendItem>;
    private privReceivingMessageQueue: Queue<ConnectionMessage>;
    private privConnectionEstablishDeferral: Deferred<ConnectionOpenResponse>;
    private privCertificateValidatedDeferral: Deferred<void>;
    private privDisconnectDeferral: Deferred<void>;
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privConnectionId: string;
    private privUri: string;
    private proxyInfo: ProxyInfo;
    private privHeaders: { [key: string]: string };
    private privLastErrorReceived: string;
    private privEnableCompression: boolean;

    public static forceNpmWebSocket: boolean = false;

    public constructor(
        uri: string,
        connectionId: string,
        messageFormatter: IWebsocketMessageFormatter,
        proxyInfo: ProxyInfo,
        headers: { [key: string]: string },
        enableCompression: boolean) {

        if (!uri) {
            throw new ArgumentNullError("uri");
        }

        if (!messageFormatter) {
            throw new ArgumentNullError("messageFormatter");
        }

        this.proxyInfo = proxyInfo;
        this.privConnectionEvents = new EventSource<ConnectionEvent>();
        this.privConnectionId = connectionId;
        this.privMessageFormatter = messageFormatter;
        this.privConnectionState = ConnectionState.None;
        this.privUri = uri;
        this.privHeaders = headers;
        this.privEnableCompression = enableCompression;

        // Add the connection ID to the headers
        this.privHeaders[HeaderNames.ConnectionId] = this.privConnectionId;
        this.privHeaders.connectionId = this.privConnectionId;

        this.privLastErrorReceived = "";
    }

    public get state(): ConnectionState {
        return this.privConnectionState;
    }

    public open(): Promise<ConnectionOpenResponse> {
        if (this.privConnectionState === ConnectionState.Disconnected) {
            return Promise.reject<ConnectionOpenResponse>(`Cannot open a connection that is in ${this.privConnectionState} state`);
        }

        if (this.privConnectionEstablishDeferral) {
            return this.privConnectionEstablishDeferral.promise;
        }

        this.privConnectionEstablishDeferral = new Deferred<ConnectionOpenResponse>();
        this.privCertificateValidatedDeferral = new Deferred<void>();

        this.privConnectionState = ConnectionState.Connecting;

        try {

            if (typeof WebSocket !== "undefined" && !WebsocketMessageAdapter.forceNpmWebSocket) {
                // Browser handles cert checks.
                this.privCertificateValidatedDeferral.resolve();

                this.privWebsocketClient = new WebSocket(this.privUri);
            } else {
                // Workaround for https://github.com/microsoft/cognitive-services-speech-sdk-js/issues/465
                // Which is root caused by https://github.com/TooTallNate/node-agent-base/issues/61
                const uri = new URL(this.privUri);
                let protocol: string = uri.protocol;

                if (protocol?.toLocaleLowerCase() === "wss:") {
                    protocol = "https:";
                } else if (protocol?.toLocaleLowerCase() === "ws:") {
                    protocol = "http:";
                }

                const options: ws.ClientOptions = { headers: this.privHeaders, perMessageDeflate: this.privEnableCompression, followRedirects: protocol.toLocaleLowerCase() === "https:" };
                // The ocsp library will handle validation for us and fail the connection if needed.
                this.privCertificateValidatedDeferral.resolve();

                options.agent = this.getAgent();

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                (options.agent as any).protocol = protocol;
                this.privWebsocketClient = new ws(this.privUri, options);
                this.privWebsocketClient.on("redirect", (redirectUrl: string): void => {
                    const event: ConnectionRedirectEvent = new ConnectionRedirectEvent(this.privConnectionId, redirectUrl, this.privUri, `Getting redirect URL from endpoint ${this.privUri} with redirect URL '${redirectUrl}'`);
                    Events.instance.onEvent(event);
                });
            }

            this.privWebsocketClient.binaryType = "arraybuffer";
            this.privReceivingMessageQueue = new Queue<ConnectionMessage>();
            this.privDisconnectDeferral = new Deferred<void>();
            this.privSendMessageQueue = new Queue<ISendItem>();
            this.processSendQueue().catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });
        } catch (error) {
            this.privConnectionEstablishDeferral.resolve(new ConnectionOpenResponse(500, error as string));
            return this.privConnectionEstablishDeferral.promise;
        }

        this.onEvent(new ConnectionStartEvent(this.privConnectionId, this.privUri));

        this.privWebsocketClient.onopen = (): void => {
            this.privCertificateValidatedDeferral.promise.then((): void => {
                this.privConnectionState = ConnectionState.Connected;
                this.onEvent(new ConnectionEstablishedEvent(this.privConnectionId));
                this.privConnectionEstablishDeferral.resolve(new ConnectionOpenResponse(200, ""));
            }, (error: string): void => {
                this.privConnectionEstablishDeferral.reject(error);
            });
        };

        this.privWebsocketClient.onerror = (e: { error: any; message: string; type: string; target: WebSocket | ws }): void => {
            this.onEvent(new ConnectionErrorEvent(this.privConnectionId, e.message, e.type));
            this.privLastErrorReceived = e.message;
        };

        this.privWebsocketClient.onclose = (e: { wasClean: boolean; code: number; reason: string; target: WebSocket | ws }): void => {
            if (this.privConnectionState === ConnectionState.Connecting) {
                this.privConnectionState = ConnectionState.Disconnected;
                // this.onEvent(new ConnectionEstablishErrorEvent(this.connectionId, e.code, e.reason));
                this.privConnectionEstablishDeferral.resolve(new ConnectionOpenResponse(e.code, e.reason + " " + this.privLastErrorReceived));
            } else {
                this.privConnectionState = ConnectionState.Disconnected;
                this.privWebsocketClient = null;
                this.onEvent(new ConnectionClosedEvent(this.privConnectionId, e.code, e.reason));
            }

            this.onClose(e.code, e.reason).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });
        };

        this.privWebsocketClient.onmessage = (e: { data: ws.Data; type: string; target: WebSocket | ws }): void => {
            const networkReceivedTime = new Date().toISOString();
            if (this.privConnectionState === ConnectionState.Connected) {
                const deferred = new Deferred<ConnectionMessage>();
                // let id = ++this.idCounter;
                this.privReceivingMessageQueue.enqueueFromPromise(deferred.promise);
                if (e.data instanceof ArrayBuffer) {
                    const rawMessage = new RawWebsocketMessage(MessageType.Binary, e.data);
                    this.privMessageFormatter
                        .toConnectionMessage(rawMessage)
                        .then((connectionMessage: ConnectionMessage): void => {
                            this.onEvent(new ConnectionMessageReceivedEvent(this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred.resolve(connectionMessage);
                        }, (error: string): void => {
                            // TODO: Events for these ?
                            deferred.reject(`Invalid binary message format. Error: ${error}`);
                        });
                } else {
                    const rawMessage = new RawWebsocketMessage(MessageType.Text, e.data);
                    this.privMessageFormatter
                        .toConnectionMessage(rawMessage)
                        .then((connectionMessage: ConnectionMessage): void => {
                            this.onEvent(new ConnectionMessageReceivedEvent(this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred.resolve(connectionMessage);
                        }, (error: string): void => {
                            // TODO: Events for these ?
                            deferred.reject(`Invalid text message format. Error: ${error}`);
                        });
                }
            }
        };

        return this.privConnectionEstablishDeferral.promise;
    }

    public send(message: ConnectionMessage): Promise<void> {
        if (this.privConnectionState !== ConnectionState.Connected) {
            return Promise.reject(`Cannot send on connection that is in ${ConnectionState[this.privConnectionState]} state`);
        }

        const messageSendStatusDeferral = new Deferred<void>();
        const messageSendDeferral = new Deferred<ISendItem>();

        this.privSendMessageQueue.enqueueFromPromise(messageSendDeferral.promise);

        this.privMessageFormatter
            .fromConnectionMessage(message)
            .then((rawMessage: RawWebsocketMessage): void => {
                messageSendDeferral.resolve({
                    Message: message,
                    RawWebsocketMessage: rawMessage,
                    sendStatusDeferral: messageSendStatusDeferral,
                });
            }, (error: string): void => {
                messageSendDeferral.reject(`Error formatting the message. ${error}`);
            });

        return messageSendStatusDeferral.promise;
    }

    public read(): Promise<ConnectionMessage> {
        if (this.privConnectionState !== ConnectionState.Connected) {
            return Promise.reject<ConnectionMessage>(`Cannot read on connection that is in ${this.privConnectionState} state`);
        }

        return this.privReceivingMessageQueue.dequeue();
    }

    public close(reason?: string): Promise<void> {
        if (this.privWebsocketClient) {
            if (this.privConnectionState !== ConnectionState.Disconnected) {
                this.privWebsocketClient.close(1000, reason ? reason : "Normal closure by client");
            }
        } else {
            return Promise.resolve();
        }

        return this.privDisconnectDeferral.promise;
    }

    public get events(): EventSource<ConnectionEvent> {
        return this.privConnectionEvents;
    }

    private sendRawMessage(sendItem: ISendItem): Promise<void> {
        try {
            // indicates we are draining the queue and it came with no message;
            if (!sendItem) {
                return Promise.resolve();
            }

            this.onEvent(new ConnectionMessageSentEvent(this.privConnectionId, new Date().toISOString(), sendItem.Message));

            // add a check for the ws readystate in order to stop the red console error 'WebSocket is already in CLOSING or CLOSED state' appearing
            if (this.isWebsocketOpen) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                this.privWebsocketClient.send(sendItem.RawWebsocketMessage.payload);
            } else {
                return Promise.reject("websocket send error: Websocket not ready " + this.privConnectionId + " " + sendItem.Message.id + " " + new Error().stack);
            }
            return Promise.resolve();

        } catch (e) {
            return Promise.reject(`websocket send error: ${e as string}`);
        }
    }

    private async onClose(code: number, reason: string): Promise<void> {
        const closeReason = `Connection closed. ${code}: ${reason}`;
        this.privConnectionState = ConnectionState.Disconnected;
        this.privDisconnectDeferral.resolve();
        await this.privReceivingMessageQueue.drainAndDispose((): void => {
            // TODO: Events for these ?
            // Logger.instance.onEvent(new LoggingEvent(LogType.Warning, null, `Failed to process received message. Reason: ${closeReason}, Message: ${JSON.stringify(pendingReceiveItem)}`));
        }, closeReason);

        await this.privSendMessageQueue.drainAndDispose((pendingSendItem: ISendItem): void => {
            pendingSendItem.sendStatusDeferral.reject(closeReason);
        }, closeReason);
    }

    private async processSendQueue(): Promise<void> {
        while (true) {
            const itemToSend: Promise<ISendItem> = this.privSendMessageQueue.dequeue();
            const sendItem: ISendItem = await itemToSend;
            // indicates we are draining the queue and it came with no message;
            if (!sendItem) {
                return;
            }

            try {
                await this.sendRawMessage(sendItem);
                sendItem.sendStatusDeferral.resolve();
            } catch (sendError) {
                sendItem.sendStatusDeferral.reject(sendError as string);
            }
        }
    }

    private onEvent(event: ConnectionEvent): void {
        this.privConnectionEvents.onEvent(event);
        Events.instance.onEvent(event);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private getAgent(): http.Agent {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const agent: { proxyInfo: ProxyInfo } = new Agent.Agent(this.createConnection) as unknown as { proxyInfo: ProxyInfo };

        if (this.proxyInfo !== undefined &&
            this.proxyInfo.HostName !== undefined &&
            this.proxyInfo.Port > 0) {
            agent.proxyInfo = this.proxyInfo;
        }

        return agent as unknown as http.Agent;
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

    private createConnection(request: Agent.ClientRequest, options: Agent.RequestOptions): Promise<net.Socket> {
        let socketPromise: Promise<net.Socket>;

        options = {
            ...options,
            ...{
                requestOCSP: true,
                servername: options.host
            }
        };

        if (!!this.proxyInfo) {
            const httpProxyAgent: HttpsProxyAgent = WebsocketMessageAdapter.GetProxyAgent(this.proxyInfo);
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

    private get isWebsocketOpen(): boolean {
        return this.privWebsocketClient && this.privWebsocketClient.readyState === this.privWebsocketClient.OPEN;
    }

}
