import { ConnectionMessage, IWebsocketMessageFormatter, Promise, RawWebsocketMessage } from "../common/Exports";
export declare class WebsocketMessageFormatter implements IWebsocketMessageFormatter {
    toConnectionMessage: (message: RawWebsocketMessage) => Promise<ConnectionMessage>;
    fromConnectionMessage: (message: ConnectionMessage) => Promise<RawWebsocketMessage>;
    private makeHeaders;
    private parseHeaders;
    private stringToArrayBuffer;
}
