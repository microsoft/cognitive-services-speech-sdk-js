import { IAudioSource } from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    OutputFormat,
    PropertyCollection,
    PropertyId,
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
    SpeechHypothesis,
    TranscriberRecognizer
} from "./Exports";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class ConversationServiceRecognizer extends ServiceRecognizerBase {

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: TranslationRecognizer | TranscriberRecognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.handleSpeechPhraseMessage = async (textBody: string): Promise<void> => this.handleSpeechPhrase(textBody);
        this.handleSpeechHypothesisMessage = (textBody: string): void => this.handleSpeechHypothesis(textBody);
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {
        void connectionMessage;
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

                    if (this.privClient instanceof TranslationRecognizer) {
                        try {
                            const ev = new TranslationRecognitionEventArgs(TranslationRecognitionResult.fromSpeechRecognitionResult(result), simpleOffset, this.privRequestSession.sessionId);
                            this.privClient.recognized(this.privClient, ev);
                        } catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                        return;
                    }
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

                if (this.privClient instanceof TranscriberRecognizer) {
                    try {
                        const event: SpeechRecognitionEventArgs = new SpeechRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);
                        this.privClient.recognized(this.privClient, event);
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

    protected handleSpeechHypothesis(textBody: string): void {
        const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(textBody);
        const offset: number = hypothesis.Offset + this.privRequestSession.currentTurnAudioOffset;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, textBody);

        const result = new SpeechRecognitionResult(
            this.privRequestSession.requestId,
            ResultReason.RecognizingSpeech,
            hypothesis.Text,
            hypothesis.Duration,
            offset,
            hypothesis.Language,
            hypothesis.LanguageDetectionConfidence,
            hypothesis.SpeakerId,
            undefined,
            textBody,
            resultProps);

        this.privRequestSession.onHypothesis(offset);

        if (this.privClient instanceof TranscriberRecognizer) {
            if (!!this.privClient.recognizing) {
                try {
                    const ev = new SpeechRecognitionEventArgs(result, hypothesis.Duration, this.privRequestSession.sessionId);
                    this.privClient.recognizing(this.privClient, ev);
                    /* eslint-disable no-empty */
                } catch (error) {
                    // Not going to let errors in the event handler
                    // trip things up.
                }
            }
        } else {
            if (this.privClient instanceof TranslationRecognizer) {
                try {
                    const ev = new TranslationRecognitionEventArgs(TranslationRecognitionResult.fromSpeechRecognitionResult(result), hypothesis.Duration, this.privRequestSession.sessionId);
                    this.privClient.recognizing(this.privClient, ev);
                    /* eslint-disable no-empty */
                } catch (error) {
                    // Not going to let errors in the event handler
                    // trip things up.
                }
            }
        }
    }
}
