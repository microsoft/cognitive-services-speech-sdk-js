import { ConnectionEvent, ConnectionMessage, ConnectionOpenResponse, ConnectionState, EventSource, IWebsocketMessageFormatter, Promise } from "../common/Exports";
export declare class WebsocketMessageAdapter {
    private privConnectionState;
    private privMessageFormatter;
    private privWebsocketClient;
    private privSendMessageQueue;
    private privReceivingMessageQueue;
    private privConnectionEstablishDeferral;
    private privDisconnectDeferral;
    private privConnectionEvents;
    private privConnectionId;
    private privUri;
    static forceNpmWebSocket: boolean;
    constructor(uri: string, connectionId: string, messageFormatter: IWebsocketMessageFormatter);
    readonly state: ConnectionState;
    open: () => Promise<ConnectionOpenResponse>;
    send: (message: ConnectionMessage) => Promise<boolean>;
    read: () => Promise<ConnectionMessage>;
    close: (reason?: string) => Promise<boolean>;
    readonly events: EventSource<ConnectionEvent>;
    private sendRawMessage;
    private onClose;
    private processSendQueue;
    private onEvent;
}
