import { IAudioSource } from "../common/Exports.js";
import {
    CancellationErrorCode,
    CancellationReason,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    Recognizer,
    ResultReason,
    SpeechRecognitionResult
} from "../sdk/Exports.js";
import {
    DetailedSpeechPhrase,
    EnumTranslation,
    IAuthentication,
    IConnectionFactory,
    OutputFormatPropertyName,
    RecognitionStatus,
    RecognizerConfig,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechHypothesis
} from "./Exports.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

export class ConversationServiceRecognizer extends ServiceRecognizerBase {

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: Recognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.handleSpeechPhraseMessage = async (textBody: string): Promise<void> => this.handleSpeechPhrase(textBody);
        this.handleSpeechHypothesisMessage = (textBody: string): void => this.handleSpeechHypothesis(textBody);
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {
        void connectionMessage;
        return;
    }

    protected handleRecognizedCallback(result: SpeechRecognitionResult, offset: number, sessionId: string): void {
        void result;
        void offset;
        void sessionId;
        return;
    }

    protected handleRecognizingCallback(result: SpeechRecognitionResult, duration: number, sessionId: string): void {
        void result;
        void duration;
        void sessionId;
        return;
    }

    protected async processSpeechMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {
        let processed: boolean = false;
        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
            case "speech.fragment":
                if (!!this.handleSpeechHypothesisMessage) {
                    this.handleSpeechHypothesisMessage(connectionMessage.textBody);
                }
                processed = true;
                break;
            case "speech.phrase":
                if (!!this.handleSpeechPhraseMessage) {
                    await this.handleSpeechPhraseMessage(connectionMessage.textBody);
                }
                processed = true;
                break;
            default:
                break;
        }
        return processed;
    }

    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {
        // Implementing to allow inheritance
        void sessionId;
        void requestId;
        void cancellationReason;
        void errorCode;
        void error;
    }

    protected async handleSpeechPhrase(textBody: string): Promise<void> {

        const simple: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(textBody, this.privRequestSession.currentTurnAudioOffset);
        const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);
        let result: SpeechRecognitionResult;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, textBody);

        this.privRequestSession.onPhraseRecognized(simple.Offset + simple.Duration);

        if (ResultReason.Canceled === resultReason) {
            const cancelReason: CancellationReason = EnumTranslation.implTranslateCancelResult(simple.RecognitionStatus);
            const cancellationErrorCode: CancellationErrorCode = EnumTranslation.implTranslateCancelErrorCode(simple.RecognitionStatus);

            await this.cancelRecognitionLocal(
                cancelReason,
                cancellationErrorCode,
                EnumTranslation.implTranslateErrorDetails(cancellationErrorCode));

        } else {
            if (simple.RecognitionStatus !== RecognitionStatus.EndOfDictation) {
                if (this.privRecognizerConfig.parameters.getProperty(OutputFormatPropertyName) === OutputFormat[OutputFormat.Simple]) {
                    result = new SpeechRecognitionResult(
                        this.privRequestSession.requestId,
                        resultReason,
                        simple.DisplayText,
                        simple.Duration,
                        simple.Offset,
                        simple.Language,
                        simple.LanguageDetectionConfidence,
                        simple.SpeakerId,
                        undefined,
                        simple.asJson(),
                        resultProps);
                } else {
                    const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(textBody, this.privRequestSession.currentTurnAudioOffset);

                    result = new SpeechRecognitionResult(
                        this.privRequestSession.requestId,
                        resultReason,
                        detailed.Text,
                        detailed.Duration,
                        detailed.Offset,
                        detailed.Language,
                        detailed.LanguageDetectionConfidence,
                        detailed.SpeakerId,
                        undefined,
                        detailed.asJson(),
                        resultProps);
                }

                this.handleRecognizedCallback(result, result.offset, this.privRequestSession.sessionId);
            }
        }
    }

    protected handleSpeechHypothesis(textBody: string): void {
        const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(textBody, this.privRequestSession.currentTurnAudioOffset);
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, textBody);

        const result = new SpeechRecognitionResult(
            this.privRequestSession.requestId,
            ResultReason.RecognizingSpeech,
            hypothesis.Text,
            hypothesis.Duration,
            hypothesis.Offset,
            hypothesis.Language,
            hypothesis.LanguageDetectionConfidence,
            hypothesis.SpeakerId,
            undefined,
            hypothesis.asJson(),
            resultProps);

        this.privRequestSession.onHypothesis(hypothesis.Offset);

        this.handleRecognizingCallback(result, hypothesis.Duration, this.privRequestSession.sessionId);
    }
}
