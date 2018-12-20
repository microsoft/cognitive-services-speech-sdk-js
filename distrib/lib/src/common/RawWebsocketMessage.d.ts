import { MessageType } from "./ConnectionMessage";
export declare class RawWebsocketMessage {
    private privMessageType;
    private privPayload;
    private privId;
    constructor(messageType: MessageType, payload: any, id?: string);
    readonly messageType: MessageType;
    readonly payload: any;
    readonly textContent: string;
    readonly binaryContent: ArrayBuffer;
    readonly id: string;
}
