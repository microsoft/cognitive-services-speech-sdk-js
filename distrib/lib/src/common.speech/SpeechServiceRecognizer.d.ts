import { IAudioSource, IConnection } from "../common/Exports";
import { CancellationErrorCode, CancellationReason, SpeechRecognitionResult, SpeechRecognizer } from "../sdk/Exports";
import { RequestSession, ServiceRecognizerBase } from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";
export declare class SpeechServiceRecognizer extends ServiceRecognizerBase {
    private privSpeechRecognizer;
    constructor(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioSource: IAudioSource, recognizerConfig: RecognizerConfig, speechRecognizer: SpeechRecognizer);
    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage, requestSession: RequestSession, connection: IConnection, successCallback?: (e: SpeechRecognitionResult) => void, errorCallBack?: (e: string) => void): void;
    protected cancelRecognition(sessionId: string, requestId: string, cancellationReason: CancellationReason, errorCode: CancellationErrorCode, error: string, cancelRecoCallback: (e: SpeechRecognitionResult) => void): void;
}
