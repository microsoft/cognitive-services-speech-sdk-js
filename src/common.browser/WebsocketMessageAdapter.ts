// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
    ConnectionClosedEvent,
    ConnectionErrorEvent,
    ConnectionEstablishedEvent,
    ConnectionEvent,
    ConnectionMessage,
    ConnectionMessageReceivedEvent,
    ConnectionMessageSentEvent,
    ConnectionOpenResponse,
    ConnectionStartEvent,
    ConnectionState,
    Deferred,
    Events,
    EventSource,
    IWebsocketMessageFormatter,
    MessageType,
    Promise,
    PromiseHelper,
    Queue,
    RawWebsocketMessage,
} from "../common/Exports";
import { ProxyInfo } from "./ProxyInfo";

// Node.JS specific web socket / browser support.
import ws from "ws";
import { CertCheckAgent } from "./CertChecks";

interface ISendItem {
    Message: ConnectionMessage;
    RawWebsocketMessage: RawWebsocketMessage;
    sendStatusDeferral: Deferred<boolean>;
}

export class WebsocketMessageAdapter {
    private privConnectionState: ConnectionState;
    private privMessageFormatter: IWebsocketMessageFormatter;
    private privWebsocketClient: WebSocket | ws;

    private privSendMessageQueue: Queue<ISendItem>;
    private privReceivingMessageQueue: Queue<ConnectionMessage>;
    private privConnectionEstablishDeferral: Deferred<ConnectionOpenResponse>;
    private privCertificateValidatedDeferral: Deferred<boolean>;
    private privDisconnectDeferral: Deferred<boolean>;
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privConnectionId: string;
    private privUri: string;
    private proxyInfo: ProxyInfo;
    private privHeaders: { [key: string]: string; };
    private privLastErrorReceived: string;

    public static forceNpmWebSocket: boolean = false;

    public constructor(
        uri: string,
        connectionId: string,
        messageFormatter: IWebsocketMessageFormatter,
        proxyInfo: ProxyInfo,
        headers: { [key: string]: string; }) {

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

        // Add the connection ID to the headers
        this.privHeaders["X-ConnectionId"] = this.privConnectionId;

        this.privLastErrorReceived = "";
    }

    public get state(): ConnectionState {
        return this.privConnectionState;
    }

    public open = (): Promise<ConnectionOpenResponse> => {
        if (this.privConnectionState === ConnectionState.Disconnected) {
            return PromiseHelper.fromError<ConnectionOpenResponse>(`Cannot open a connection that is in ${this.privConnectionState} state`);
        }

        if (this.privConnectionEstablishDeferral) {
            return this.privConnectionEstablishDeferral.promise();
        }

        this.privConnectionEstablishDeferral = new Deferred<ConnectionOpenResponse>();
        this.privCertificateValidatedDeferral = new Deferred<boolean>();

        this.privConnectionState = ConnectionState.Connecting;

        try {

            if (typeof WebSocket !== "undefined" && !WebsocketMessageAdapter.forceNpmWebSocket) {
                // Browser handles cert checks.
                this.privCertificateValidatedDeferral.resolve(true);

                this.privWebsocketClient = new WebSocket(this.privUri);
            } else {
                const options: ws.ClientOptions = { headers: this.privHeaders };
                // The ocsp library will handle validation for us and fail the connection if needed.
                this.privCertificateValidatedDeferral.resolve(true);
                const checkAgent: CertCheckAgent = new CertCheckAgent(this.proxyInfo);

                options.agent = checkAgent.GetAgent();
                this.privWebsocketClient = new ws(this.privUri, options);
            }

            this.privWebsocketClient.binaryType = "arraybuffer";
            this.privReceivingMessageQueue = new Queue<ConnectionMessage>();
            this.privDisconnectDeferral = new Deferred<boolean>();
            this.privSendMessageQueue = new Queue<ISendItem>();
            this.processSendQueue();
        } catch (error) {
            this.privConnectionEstablishDeferral.resolve(new ConnectionOpenResponse(500, error));
            return this.privConnectionEstablishDeferral.promise();
        }

        this.onEvent(new ConnectionStartEvent(this.privConnectionId, this.privUri));

        this.privWebsocketClient.onopen = (e: { target: WebSocket | ws }) => {
            this.privCertificateValidatedDeferral.promise().on((): void => {
                this.privConnectionState = ConnectionState.Connected;
                this.onEvent(new ConnectionEstablishedEvent(this.privConnectionId));
                this.privConnectionEstablishDeferral.resolve(new ConnectionOpenResponse(200, ""));
            }, (error: string): void => {
                this.privConnectionEstablishDeferral.reject(error);
            });
        };

        this.privWebsocketClient.onerror = (e: { error: any; message: string; type: string; target: WebSocket | ws }) => {
            this.onEvent(new ConnectionErrorEvent(this.privConnectionId, e.message, e.type));
            this.privLastErrorReceived = e.message;
        };

        this.privWebsocketClient.onclose = (e: { wasClean: boolean; code: number; reason: string; target: WebSocket | ws }) => {
            if (this.privConnectionState === ConnectionState.Connecting) {
                this.privConnectionState = ConnectionState.Disconnected;
                // this.onEvent(new ConnectionEstablishErrorEvent(this.connectionId, e.code, e.reason));
                this.privConnectionEstablishDeferral.resolve(new ConnectionOpenResponse(e.code, e.reason + " " + this.privLastErrorReceived));
            } else {
                this.privConnectionState = ConnectionState.Disconnected;
                this.onEvent(new ConnectionClosedEvent(this.privConnectionId, e.code, e.reason));
            }

            this.onClose(e.code, e.reason);
        };

        this.privWebsocketClient.onmessage = (e: { data: ws.Data; type: string; target: WebSocket | ws }) => {
            const networkReceivedTime = new Date().toISOString();
            if (this.privConnectionState === ConnectionState.Connected) {
                const deferred = new Deferred<ConnectionMessage>();
                // let id = ++this.idCounter;
                this.privReceivingMessageQueue.enqueueFromPromise(deferred.promise());
                if (e.data instanceof ArrayBuffer) {
                    const rawMessage = new RawWebsocketMessage(MessageType.Binary, e.data);
                    this.privMessageFormatter
                        .toConnectionMessage(rawMessage)
                        .on((connectionMessage: ConnectionMessage) => {
                            this.onEvent(new ConnectionMessageReceivedEvent(this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred.resolve(connectionMessage);
                        }, (error: string) => {
                            // TODO: Events for these ?
                            deferred.reject(`Invalid binary message format. Error: ${error}`);
                        });
                } else {
                    const rawMessage = new RawWebsocketMessage(MessageType.Text, e.data);
                    this.privMessageFormatter
                        .toConnectionMessage(rawMessage)
                        .on((connectionMessage: ConnectionMessage) => {
                            this.onEvent(new ConnectionMessageReceivedEvent(this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred.resolve(connectionMessage);
                        }, (error: string) => {
                            // TODO: Events for these ?
                            deferred.reject(`Invalid text message format. Error: ${error}`);
                        });
                }
            }
        };

        return this.privConnectionEstablishDeferral.promise();
    }

    public send = (message: ConnectionMessage): Promise<boolean> => {
        if (this.privConnectionState !== ConnectionState.Connected) {
            return PromiseHelper.fromError<boolean>(`Cannot send on connection that is in ${this.privConnectionState} state`);
        }

        const messageSendStatusDeferral = new Deferred<boolean>();
        const messageSendDeferral = new Deferred<ISendItem>();

        this.privSendMessageQueue.enqueueFromPromise(messageSendDeferral.promise());

        this.privMessageFormatter
            .fromConnectionMessage(message)
            .on((rawMessage: RawWebsocketMessage) => {
                messageSendDeferral.resolve({
                    Message: message,
                    RawWebsocketMessage: rawMessage,
                    sendStatusDeferral: messageSendStatusDeferral,
                });
            }, (error: string) => {
                messageSendDeferral.reject(`Error formatting the message. ${error}`);
            });

        return messageSendStatusDeferral.promise();
    }

    public read = (): Promise<ConnectionMessage> => {
        if (this.privConnectionState !== ConnectionState.Connected) {
            return PromiseHelper.fromError<ConnectionMessage>(`Cannot read on connection that is in ${this.privConnectionState} state`);
        }

        return this.privReceivingMessageQueue.dequeue();
    }

    public close = (reason?: string): Promise<boolean> => {
        if (this.privWebsocketClient) {
            if (this.privConnectionState !== ConnectionState.Disconnected) {
                this.privWebsocketClient.close(1000, reason ? reason : "Normal closure by client");
            }
        } else {
            const deferral = new Deferred<boolean>();
            deferral.resolve(true);
            return deferral.promise();
        }

        return this.privDisconnectDeferral.promise();
    }

    public get events(): EventSource<ConnectionEvent> {
        return this.privConnectionEvents;
    }

    private sendRawMessage = (sendItem: ISendItem): Promise<boolean> => {
        try {
            // indicates we are draining the queue and it came with no message;
            if (!sendItem) {
                return PromiseHelper.fromResult(true);
            }

            this.onEvent(new ConnectionMessageSentEvent(this.privConnectionId, new Date().toISOString(), sendItem.Message));

            // add a check for the ws readystate in order to stop the red console error 'WebSocket is already in CLOSING or CLOSED state' appearing
            if (this.isWebsocketOpen) {
                this.privWebsocketClient.send(sendItem.RawWebsocketMessage.payload);
            } else {
                return PromiseHelper.fromError<boolean>("websocket send error: Websocket not ready");
            }
            return PromiseHelper.fromResult(true);

        } catch (e) {
            return PromiseHelper.fromError<boolean>(`websocket send error: ${e}`);
        }
    }

    private onClose = (code: number, reason: string): void => {
        const closeReason = `Connection closed. ${code}: ${reason}`;
        this.privConnectionState = ConnectionState.Disconnected;
        this.privDisconnectDeferral.resolve(true);
        this.privReceivingMessageQueue.dispose(reason);
        this.privReceivingMessageQueue.drainAndDispose((pendingReceiveItem: ConnectionMessage) => {
            // TODO: Events for these ?
            // Logger.instance.onEvent(new LoggingEvent(LogType.Warning, null, `Failed to process received message. Reason: ${closeReason}, Message: ${JSON.stringify(pendingReceiveItem)}`));
        }, closeReason);

        this.privSendMessageQueue.drainAndDispose((pendingSendItem: ISendItem) => {
            pendingSendItem.sendStatusDeferral.reject(closeReason);
        }, closeReason);
    }

    private processSendQueue = (): void => {
        this.privSendMessageQueue
            .dequeue()
            .on((sendItem: ISendItem) => {
                // indicates we are draining the queue and it came with no message;
                if (!sendItem) {
                    return;
                }

                this.sendRawMessage(sendItem)
                    .on((result: boolean) => {
                        sendItem.sendStatusDeferral.resolve(result);
                        this.processSendQueue();
                    }, (sendError: string) => {
                        sendItem.sendStatusDeferral.reject(sendError);
                        this.processSendQueue();
                    });
            }, (error: string) => {
                // do nothing
            });
    }

    private onEvent = (event: ConnectionEvent): void => {
        this.privConnectionEvents.onEvent(event);
        Events.instance.onEvent(event);
    }

    private get isWebsocketOpen(): boolean {
        return this.privWebsocketClient && this.privWebsocketClient.readyState === this.privWebsocketClient.OPEN;
    }

}
