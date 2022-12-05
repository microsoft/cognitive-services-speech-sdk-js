import { IAudioSource } from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    Recognizer,
    ResultReason,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    TranslationRecognitionEventArgs,
    TranslationRecognitionResult,
    TranslationRecognizer
} from "../sdk/Exports";
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
    TranscriberRecognizer
} from "./Exports";
import { ITranslationPhrase } from "./ServiceMessages/TranslationPhrase";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class ConversationServiceRecognizer extends ServiceRecognizerBase {

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: Recognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.handleSpeechPhraseMessage = async (textBody: string, recognizer: Recognizer): Promise<void> => this.handleSpeechPhrase(textBody, recognizer);
    }


    // eslint-disable-next-line require-await
    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {
        // Implementing to allow inheritance
        void connectionMessage;
        return;
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

    protected async handleSpeechPhrase(textBody: string, recognizer: Recognizer): Promise<void> {

        const simple: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(textBody);
        const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);
        let result: SpeechRecognitionResult;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, textBody);
        const simpleOffset = simple.Offset + this.privRequestSession.currentTurnAudioOffset;

        this.privRequestSession.onPhraseRecognized(this.privRequestSession.currentTurnAudioOffset + simple.Offset + simple.Duration);

        if (ResultReason.Canceled === resultReason) {
            const cancelReason: CancellationReason = EnumTranslation.implTranslateCancelResult(simple.RecognitionStatus);
            const cancellationErrorCode: CancellationErrorCode = EnumTranslation.implTranslateCancelErrorCode(simple.RecognitionStatus);

            await this.cancelRecognitionLocal(
                cancelReason,
                cancellationErrorCode,
                EnumTranslation.implTranslateErrorDetails(cancellationErrorCode));

        } else {
            if (!(this.privRequestSession.isSpeechEnded && resultReason === ResultReason.NoMatch && simple.RecognitionStatus !== RecognitionStatus.InitialSilenceTimeout)) {
                if (!!recognizer && recognizer instanceof TranslationRecognizer) {
                    try {
                        const phrase: { SpeechPhrase: ITranslationPhrase } = JSON.parse(textBody) as { SpeechPhrase: ITranslationPhrase };
                        const translationResult = new TranslationRecognitionResult(
                            undefined,
                            this.privRequestSession.requestId,
                            resultReason,
                            phrase.SpeechPhrase.Text,
                            phrase.SpeechPhrase.Duration,
                            simpleOffset,
                            "",
                            JSON.stringify(phrase.SpeechPhrase),
                            resultProps);

                        const ev = new TranslationRecognitionEventArgs(translationResult, simpleOffset, this.privRequestSession.sessionId);
                        recognizer.recognized(recognizer, ev);
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                    return;
                }
                if (this.privRecognizerConfig.parameters.getProperty(OutputFormatPropertyName) === OutputFormat[OutputFormat.Simple]) {
                    result = new SpeechRecognitionResult(
                        this.privRequestSession.requestId,
                        resultReason,
                        simple.DisplayText,
                        simple.Duration,
                        simpleOffset,
                        simple.Language,
                        simple.LanguageDetectionConfidence,
                        simple.SpeakerId,
                        undefined,
                        textBody,
                        resultProps);
                } else {
                    const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(textBody);
                    const totalOffset: number = detailed.Offset + this.privRequestSession.currentTurnAudioOffset;
                    const offsetCorrectedJson: string = detailed.getJsonWithCorrectedOffsets(totalOffset);

                    result = new SpeechRecognitionResult(
                        this.privRequestSession.requestId,
                        resultReason,
                        detailed.Text,
                        detailed.Duration,
                        totalOffset,
                        detailed.Language,
                        detailed.LanguageDetectionConfidence,
                        detailed.SpeakerId,
                        undefined,
                        offsetCorrectedJson,
                        resultProps);
                }

                if (!!recognizer && recognizer instanceof TranscriberRecognizer) {
                    try {
                        const event: SpeechRecognitionEventArgs = new SpeechRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);
                        recognizer.recognized(this.privRecognizer, event);
                        if (!!this.privSuccessCallback) {
                            try {
                                this.privSuccessCallback(result);
                            } catch (e) {
                                if (!!this.privErrorCallback) {
                                    this.privErrorCallback(e as string);
                                }
                            }
                            // Only invoke the call back once.
                            // and if it's successful don't invoke the
                            // error after that.
                            this.privSuccessCallback = undefined;
                            this.privErrorCallback = undefined;
                        }
                        /* eslint-disable no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
            }
        }
    }

    /*
    protected async handleSpeechHypothesis(textBody: string, recognized: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void): Promise<void> {
        void textBody;
        void recognized;
    }
    */
}
