import { IStringDictionary } from "./IDictionary";
export declare enum MessageType {
    Text = 0,
    Binary = 1
}
export declare class ConnectionMessage {
    private privMessageType;
    private privHeaders;
    private privBody;
    private privId;
    constructor(messageType: MessageType, body: any, headers?: IStringDictionary<string>, id?: string);
    readonly messageType: MessageType;
    readonly headers: any;
    readonly body: any;
    readonly textBody: string;
    readonly binaryBody: ArrayBuffer;
    readonly id: string;
}
