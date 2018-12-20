import { ConnectionMessage, IStringDictionary, MessageType } from "../common/Exports";
export declare class SpeechConnectionMessage extends ConnectionMessage {
    private privPath;
    private privRequestId;
    private privContentType;
    private privAdditionalHeaders;
    constructor(messageType: MessageType, path: string, requestId: string, contentType: string, body: any, additionalHeaders?: IStringDictionary<string>, id?: string);
    readonly path: string;
    readonly requestId: string;
    readonly contentType: string;
    readonly additionalHeaders: IStringDictionary<string>;
    static fromConnectionMessage: (message: ConnectionMessage) => SpeechConnectionMessage;
}
