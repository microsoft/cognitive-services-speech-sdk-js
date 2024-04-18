// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Define speech synthesis audio output formats.
 * @enum SpeechSynthesisOutputFormat
 * Updated in version 1.17.0
 */
export enum SpeechSynthesisOutputFormat {
    /**
     * raw-8khz-8bit-mono-mulaw
     * @member SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw,
     */
    Raw8Khz8BitMonoMULaw,

    /**
     * riff-16khz-16kbps-mono-siren
     * @note Unsupported by the service. Do not use this value.
     * @member SpeechSynthesisOutputFormat.Riff16Khz16KbpsMonoSiren
     */
    Riff16Khz16KbpsMonoSiren,

    /**
     * audio-16khz-16kbps-mono-siren
     * @note Unsupported by the service. Do not use this value.
     * @member SpeechSynthesisOutputFormat.Audio16Khz16KbpsMonoSiren
     */
    Audio16Khz16KbpsMonoSiren,

    /**
     * audio-16khz-32kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
     */
    Audio16Khz32KBitRateMonoMp3,

    /**
     * audio-16khz-128kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3
     */
    Audio16Khz128KBitRateMonoMp3,

    /**
     * audio-16khz-64kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio16Khz64KBitRateMonoMp3
     */
    Audio16Khz64KBitRateMonoMp3,

    /**
     * audio-24khz-48kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3
     */
    Audio24Khz48KBitRateMonoMp3,

    /**
     * audio-24khz-96kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3
     */
    Audio24Khz96KBitRateMonoMp3,

    /**
     * audio-24khz-160kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3
     */
    Audio24Khz160KBitRateMonoMp3,

    /**
     * raw-16khz-16bit-mono-truesilk
     * @member SpeechSynthesisOutputFormat.Raw16Khz16BitMonoTrueSilk
     */
    Raw16Khz16BitMonoTrueSilk,

    /**
     * riff-16khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm
     */
    Riff16Khz16BitMonoPcm,

    /**
     * riff-8khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Riff8Khz16BitMonoPcm
     */
    Riff8Khz16BitMonoPcm,

    /**
     * riff-24khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm
     */
    Riff24Khz16BitMonoPcm,

    /**
     * riff-8khz-8bit-mono-mulaw
     * @member SpeechSynthesisOutputFormat.Riff8Khz8BitMonoMULaw
     */
    Riff8Khz8BitMonoMULaw,

    /**
     * raw-16khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm
     */
    Raw16Khz16BitMonoPcm,

    /**
     * raw-24khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Raw24Khz16BitMonoPcm
     */
    Raw24Khz16BitMonoPcm,

    /**
     * raw-8khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Raw8Khz16BitMonoPcm
     */
    Raw8Khz16BitMonoPcm,

    /**
     * ogg-16khz-16bit-mono-opus
     * @member SpeechSynthesisOutputFormat.Ogg16Khz16BitMonoOpus
     */
    Ogg16Khz16BitMonoOpus,

    /**
     * ogg-24khz-16bit-mono-opus
     * @member SpeechSynthesisOutputFormat.Ogg24Khz16BitMonoOpus
     */
    Ogg24Khz16BitMonoOpus,

    /**
     * raw-48khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Raw48Khz16BitMonoPcm
     */
    Raw48Khz16BitMonoPcm,

    /**
     * riff-48khz-16bit-mono-pcm
     * @member SpeechSynthesisOutputFormat.Riff48Khz16BitMonoPcm
     */

    Riff48Khz16BitMonoPcm,
    /**
     * audio-48khz-96kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio48Khz96KBitRateMonoMp3
     */
    Audio48Khz96KBitRateMonoMp3,

    /**
     * audio-48khz-192kbitrate-mono-mp3
     * @member SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3
     */
    Audio48Khz192KBitRateMonoMp3,

    /**
     * ogg-48khz-16bit-mono-opus
     * Added in version 1.16.0
     * @member SpeechSynthesisOutputFormat.Ogg48Khz16BitMonoOpus
     */
    Ogg48Khz16BitMonoOpus,

    /**
     * webm-16khz-16bit-mono-opus
     * Added in version 1.16.0
     * @member SpeechSynthesisOutputFormat.Webm16Khz16BitMonoOpus
     */
    Webm16Khz16BitMonoOpus,

    /**
     * webm-24khz-16bit-mono-opus
     * Added in version 1.16.0
     * @member SpeechSynthesisOutputFormat.Webm24Khz16BitMonoOpus
     */
    Webm24Khz16BitMonoOpus,

    /**
     * raw-24khz-16bit-mono-truesilk
     * Added in version 1.17.0
     * @member SpeechSynthesisOutputFormat.Raw24Khz16BitMonoTrueSilk
     */
     Raw24Khz16BitMonoTrueSilk,

    /**
     * raw-8khz-8bit-mono-alaw
     * Added in version 1.17.0
     * @member SpeechSynthesisOutputFormat.Raw8Khz8BitMonoALaw
     */
     Raw8Khz8BitMonoALaw,

    /**
     * riff-8khz-8bit-mono-alaw
     * Added in version 1.17.0
     * @member SpeechSynthesisOutputFormat.Riff8Khz8BitMonoALaw
     */
     Riff8Khz8BitMonoALaw,

    /**
     * webm-24khz-16bit-24kbps-mono-opus
     * Audio compressed by OPUS codec in a webm container, with bitrate of 24kbps, optimized for IoT scenario.
     * Added in version 1.19.0
     * @member SpeechSynthesisOutputFormat.Webm24Khz16Bit24KbpsMonoOpus
     */
    Webm24Khz16Bit24KbpsMonoOpus,

    /**
     * audio-16khz-16bit-32kbps-mono-opus
     * Audio compressed by OPUS codec without container, with bitrate of 32kbps.
     * Added in version 1.20.0
     * @member SpeechSynthesisOutputFormat.Audio16Khz16Bit32KbpsMonoOpus
     */
    Audio16Khz16Bit32KbpsMonoOpus,

    /**
     * audio-24khz-16bit-48kbps-mono-opus
     * Audio compressed by OPUS codec without container, with bitrate of 48kbps.
     * Added in version 1.20.0
     * @member SpeechSynthesisOutputFormat.Audio24Khz16Bit48KbpsMonoOpus
     */
    Audio24Khz16Bit48KbpsMonoOpus,

    /**
     * audio-24khz-16bit-24kbps-mono-opus
     * Audio compressed by OPUS codec without container, with bitrate of 24kbps.
     * Added in version 1.20.0
     * @member SpeechSynthesisOutputFormat.Audio24Khz16Bit24KbpsMonoOpus
     */
    Audio24Khz16Bit24KbpsMonoOpus,

    /**
     * raw-22050hz-16bit-mono-pcm
     * Raw PCM audio at 22050Hz sampling rate and 16-bit depth.
     * Added in version 1.22.0
     * @member SpeechSynthesisOutputFormat.Raw22050Hz16BitMonoPcm
     */
    Raw22050Hz16BitMonoPcm,

    /**
     * riff-22050hz-16bit-mono-pcm
     * PCM audio at 22050Hz sampling rate and 16-bit depth, with RIFF header.
     * Added in version 1.22.0
     * @member SpeechSynthesisOutputFormat.Riff22050Hz16BitMonoPcm
     */
    Riff22050Hz16BitMonoPcm,

    /**
     * raw-44100hz-16bit-mono-pcm
     * Raw PCM audio at 44100Hz sampling rate and 16-bit depth.
     * Added in version 1.22.0
     * @member SpeechSynthesisOutputFormat.Raw44100Hz16BitMonoPcm
     */
    Raw44100Hz16BitMonoPcm,

    /**
     * riff-44100hz-16bit-mono-pcm
     * PCM audio at 44100Hz sampling rate and 16-bit depth, with RIFF header.
     * Added in version 1.22.0
     * @member SpeechSynthesisOutputFormat.Riff44100Hz16BitMonoPcm
     */
    Riff44100Hz16BitMonoPcm,

    /**
     * amr-wb-16000hz
     * AMR-WB audio at 16kHz sampling rate.
     * Added in version 1.38.0
     * @member SpeechSynthesisOutputFormat.AmrWb16000Hz
     */
    AmrWb16000Hz,

    /**
     * g722-16khz-64kbps
     * G.722 audio at 16kHz sampling rate and 64kbps bitrate.
     * Added in version 1.38.0
     */
    G72216Khz64Kbps
}
