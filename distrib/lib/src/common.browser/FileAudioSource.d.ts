import { AudioStreamFormat } from "../../src/sdk/Audio/AudioStreamFormat";
import { AudioSourceEvent, EventSource, IAudioSource, IAudioStreamNode, Promise } from "../common/Exports";
export declare class FileAudioSource implements IAudioSource {
    private static readonly SAMPLE_RATE;
    private static readonly CHUNK_SIZE;
    private static readonly UPLOAD_INTERVAL;
    private static readonly MAX_SIZE;
    private static readonly FILEFORMAT;
    private privStreams;
    private privId;
    private privEvents;
    private privFile;
    constructor(file: File, audioSourceId?: string);
    readonly format: AudioStreamFormat;
    turnOn: () => Promise<boolean>;
    id: () => string;
    attach: (audioNodeId: string) => Promise<IAudioStreamNode>;
    detach: (audioNodeId: string) => void;
    turnOff: () => Promise<boolean>;
    readonly events: EventSource<AudioSourceEvent>;
    private upload;
    private onEvent;
}
