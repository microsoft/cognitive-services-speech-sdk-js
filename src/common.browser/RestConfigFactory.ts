
import { IErrorMessages } from "../common/Exports";
/**
 * HTTP request helper
 */
export interface IRequestOptions {
    headers?: {[key: string]: string};
    ignoreCache?: boolean;
    timeout?: number;
}

export interface IRestParams {
    apiVersion: string;
    authorization: string;
    clientAppId: string;
    correlationId: string;
    languageCode: string;
    nickname: string;
    profanity: string;
    requestId: string;
    roomId: string;
    sessionToken: string;
    subscriptionKey: string;
    subscriptionRegion: string;
    token: string;
}

export class RestConfigFactory {

    public static get requestOptions(): IRequestOptions {
        return RestConfigFactory.privDefaultRequestOptions;
    }

    public static get configParams(): IRestParams {
        return RestConfigFactory.privDefaultParams;
    }

    public static get restErrors(): IErrorMessages {
        return RestConfigFactory.privRestErrors;
    }

    private static readonly privDefaultRequestOptions: IRequestOptions = {
        headers: {
            Accept: "application/json",
        },
        ignoreCache: false,
        timeout: 5000,
    };

    private static readonly privRestErrors: IErrorMessages = {
        authInvalidSubscriptionKey: "You must specify either an authentication token to use, or a Cognitive Speech subscription key.",
        authInvalidSubscriptionRegion: "You must specify the Cognitive Speech region to use.",
        invalidArgs: "Required input not found: {arg}.",
        invalidCreateJoinConversationResponse: "Creating/Joining conversation failed with HTTP {status}.",
        invalidParticipantRequest: "The requested participant was not found.",
        permissionDeniedConnect: "Required credentials not found.",
        permissionDeniedConversation: "Invalid operation: only the host can {command} the conversation.",
        permissionDeniedParticipant: "Invalid operation: only the host can {command} a participant.",
        permissionDeniedSend: "Invalid operation: the conversation is not in a connected state.",
        permissionDeniedStart: "Invalid operation: there is already an active conversation.",
    };

    private static readonly privDefaultParams: IRestParams = {
        apiVersion: "api-version",
        authorization: "Authorization",
        clientAppId: "X-ClientAppId",
        correlationId: "X-CorrelationId",
        languageCode: "language",
        nickname: "nickname",
        profanity: "profanity",
        requestId: "X-RequestId",
        roomId: "roomid",
        sessionToken: "token",
        subscriptionKey: "Ocp-Apim-Subscription-Key",
        subscriptionRegion: "Ocp-Apim-Subscription-Region",
        token: "X-CapitoToken",
    };

}
