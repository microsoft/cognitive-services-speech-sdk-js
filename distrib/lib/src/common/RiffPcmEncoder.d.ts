export declare class RiffPcmEncoder {
    private privActualSampleRate;
    private privDesiredSampleRate;
    private privChannelCount;
    constructor(actualSampleRate: number, desiredSampleRate: number);
    encode: (needHeader: boolean, actualAudioFrame: Float32Array) => ArrayBuffer;
    private setString;
    private floatTo16BitPCM;
    private downSampleAudioFrame;
}
