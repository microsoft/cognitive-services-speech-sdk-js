import { ConnectionEvent, ConnectionMessage, ConnectionOpenResponse, ConnectionState, EventSource, IConnection, IStringDictionary, IWebsocketMessageFormatter, Promise } from "../common/Exports";
export declare class WebsocketConnection implements IConnection {
    private privUri;
    private privMessageFormatter;
    private privConnectionMessageAdapter;
    private privId;
    private privIsDisposed;
    constructor(uri: string, queryParameters: IStringDictionary<string>, headers: IStringDictionary<string>, messageFormatter: IWebsocketMessageFormatter, connectionId?: string);
    dispose: () => void;
    isDisposed: () => boolean;
    readonly id: string;
    state: () => ConnectionState;
    open: () => Promise<ConnectionOpenResponse>;
    send: (message: ConnectionMessage) => Promise<boolean>;
    read: () => Promise<ConnectionMessage>;
    readonly events: EventSource<ConnectionEvent>;
}
