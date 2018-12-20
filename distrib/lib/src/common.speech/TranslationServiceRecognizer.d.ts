import { IAudioSource, IConnection } from "../common/Exports";
import { CancellationErrorCode, CancellationReason, SpeechRecognitionResult, TranslationRecognitionResult, TranslationRecognizer } from "../sdk/Exports";
import { RequestSession, ServiceRecognizerBase } from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";
export declare class TranslationServiceRecognizer extends ServiceRecognizerBase {
    private privTranslationRecognizer;
    constructor(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioSource: IAudioSource, recognizerConfig: RecognizerConfig, translationRecognizer: TranslationRecognizer);
    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage, requestSession: RequestSession, connection: IConnection, successCallback?: (e: TranslationRecognitionResult) => void, errorCallBack?: (e: string) => void): void;
    protected cancelRecognition(sessionId: string, requestId: string, cancellationReason: CancellationReason, errorCode: CancellationErrorCode, error: string, cancelRecoCallback: (e: SpeechRecognitionResult) => void): void;
    private fireEventForResult;
    private sendSynthesisAudio;
}
