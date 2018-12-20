import { Stream } from "../common/Exports";
import { IRecorder } from "./IRecorder";
export declare class OpusRecorder implements IRecorder {
    private privMediaResources;
    private privMediaRecorderOptions;
    constructor(options?: {
        mimeType: string;
        bitsPerSecond: number;
    });
    record: (context: AudioContext, mediaStream: MediaStream, outputStream: Stream<ArrayBuffer>) => void;
    releaseMediaResources: (context: AudioContext) => void;
}
