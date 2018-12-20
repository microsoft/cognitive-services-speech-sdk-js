import { CancellationReason, ResultReason } from "../sdk/Exports";
import { RecognitionStatus } from "./Exports";
export declare class EnumTranslation {
    static implTranslateRecognitionResult(recognitionStatus: RecognitionStatus): ResultReason;
    static implTranslateCancelResult(recognitionStatus: RecognitionStatus): CancellationReason;
}
