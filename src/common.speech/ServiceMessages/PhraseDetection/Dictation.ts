// --------------------------------------------------------------------------------------------------------------------
// Ported from SpeechRecognition.Protocols.Universal.Applications.Contracts.V20241101.DTO.PhraseDetection
// --------------------------------------------------------------------------------------------------------------------

import { Segmentation } from "./Segmentation";

/**
 * Defines the phrase detection payload in the speech Context message
 */
export interface Dictation {
    /**
     * The segmentation configuration.
     */
    segmentation?: Segmentation;
}
