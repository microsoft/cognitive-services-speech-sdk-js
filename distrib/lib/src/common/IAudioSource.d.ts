import { AudioStreamFormat } from "../../src/sdk/Exports";
import { AudioSourceEvent } from "./AudioSourceEvents";
import { EventSource } from "./EventSource";
import { IDetachable } from "./IDetachable";
import { Promise } from "./Promise";
import { IStreamChunk } from "./Stream";
export interface IAudioSource {
    id(): string;
    turnOn(): Promise<boolean>;
    attach(audioNodeId: string): Promise<IAudioStreamNode>;
    detach(audioNodeId: string): void;
    turnOff(): Promise<boolean>;
    events: EventSource<AudioSourceEvent>;
    format: AudioStreamFormat;
}
export interface IAudioStreamNode extends IDetachable {
    id(): string;
    read(): Promise<IStreamChunk<ArrayBuffer>>;
}
