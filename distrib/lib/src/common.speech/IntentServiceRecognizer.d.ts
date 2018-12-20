import { IAudioSource, IConnection } from "../common/Exports";
import { CancellationErrorCode, CancellationReason, IntentRecognitionResult, IntentRecognizer, SpeechRecognitionResult } from "../sdk/Exports";
import { AddedLmIntent, RequestSession, ServiceRecognizerBase } from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";
export declare class IntentServiceRecognizer extends ServiceRecognizerBase {
    private privIntentRecognizer;
    private privAddedLmIntents;
    private privIntentDataSent;
    private privUmbrellaIntent;
    private privPendingIntentArgs;
    constructor(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioSource: IAudioSource, recognizerConfig: RecognizerConfig, recognizer: IntentRecognizer, intentDataSent: boolean);
    setIntents(addedIntents: {
        [id: string]: AddedLmIntent;
    }, umbrellaIntent: AddedLmIntent): void;
    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage, requestSession: RequestSession, connection: IConnection, successCallback?: (e: IntentRecognitionResult) => void, errorCallBack?: (e: string) => void): void;
    protected cancelRecognition(sessionId: string, requestId: string, cancellationReason: CancellationReason, errorCode: CancellationErrorCode, error: string, cancelRecoCallback: (e: SpeechRecognitionResult) => void): void;
}
