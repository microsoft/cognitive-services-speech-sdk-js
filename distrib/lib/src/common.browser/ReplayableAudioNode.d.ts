import { AudioStreamFormatImpl } from "../../src/sdk/Audio/AudioStreamFormat";
import { IAudioStreamNode, IStreamChunk, Promise } from "../common/Exports";
export declare class ReplayableAudioNode implements IAudioStreamNode {
    private privAudioNode;
    private privFormat;
    private privBuffers;
    private privReplayOffset;
    private privLastShrinkOffset;
    private privBufferStartOffset;
    private privBufferSerial;
    private privBufferedBytes;
    private privReplay;
    constructor(audioSource: IAudioStreamNode, format: AudioStreamFormatImpl);
    id: () => string;
    read(): Promise<IStreamChunk<ArrayBuffer>>;
    detach(): void;
    replay(): void;
    shrinkBuffers(offset: number): void;
}
