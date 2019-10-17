// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioOutputStream, PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream";
import { ActivityPayloadResponse, MessageDataStreamType } from "./ServiceMessages/ActivityResponsePayload";

export class DialogServiceTurnState {
    private privRequestId: string;
    private privIsCompleted: boolean;
    private privAudioStream: PullAudioOutputStreamImpl;

    constructor(requestId: string) {
        this.privRequestId = requestId;
        this.privIsCompleted = false;
        this.privAudioStream = null;
    }

    public get audioStream(): PullAudioOutputStreamImpl {
        return this.privAudioStream;
    }

    public processActivityPayload(payload: ActivityPayloadResponse): PullAudioOutputStreamImpl {
        if (payload.messageDataStreamType === MessageDataStreamType.TextToSpeechAudio) {
            this.privAudioStream = AudioOutputStream.createPullStream() as PullAudioOutputStreamImpl;
            // tslint:disable-next-line:no-console
            console.info("Audio debugturn:" + this.privRequestId);
        }
        return this.privAudioStream;
    }

    public complete(): void {
        if (this.privAudioStream != null) {
            this.privAudioStream.close();
        }
    }
}
