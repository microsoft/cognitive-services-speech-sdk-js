import { Stream } from "../common/Exports";
export interface IRecorder {
    record(context: AudioContext, mediaStream: MediaStream, outputStream: Stream<ArrayBuffer>): void;
    releaseMediaResources(context: AudioContext): void;
}
