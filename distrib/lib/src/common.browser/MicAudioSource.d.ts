import { AudioStreamFormat } from "../../src/sdk/Audio/AudioStreamFormat";
import { AudioSourceEvent, EventSource, IAudioSource, IAudioStreamNode, Promise } from "../common/Exports";
import { IRecorder } from "./IRecorder";
export declare class MicAudioSource implements IAudioSource {
    private readonly privRecorder;
    private static readonly AUDIOFORMAT;
    private privStreams;
    private privId;
    private privEvents;
    private privInitializeDeferral;
    private privMediaStream;
    private privContext;
    private readonly privConstraints;
    constructor(privRecorder: IRecorder, constraints?: MediaStreamConstraints, audioSourceId?: string);
    readonly format: AudioStreamFormat;
    turnOn: () => Promise<boolean>;
    id: () => string;
    attach: (audioNodeId: string) => Promise<IAudioStreamNode>;
    detach: (audioNodeId: string) => void;
    turnOff: () => Promise<boolean>;
    readonly events: EventSource<AudioSourceEvent>;
    private listen;
    private onEvent;
    private createAudioContext;
    private destroyAudioContext;
}
