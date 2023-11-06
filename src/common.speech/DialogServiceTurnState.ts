// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat.js";
import { AudioOutputStream, PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream.js";
import { DialogServiceTurnStateManager } from "./DialogServiceTurnStateManager.js";
import { ActivityPayloadResponse, MessageDataStreamType } from "./ServiceMessages/ActivityResponsePayload.js";

export class DialogServiceTurnState {
    private privRequestId: string;
    private privIsCompleted: boolean;
    private privAudioStream: PullAudioOutputStreamImpl;
    private privTimeoutToken: any;
    private privTurnManager: DialogServiceTurnStateManager;

    public constructor(manager: DialogServiceTurnStateManager, requestId: string) {
        this.privRequestId = requestId;
        this.privIsCompleted = false;
        this.privAudioStream = null;
        this.privTurnManager = manager;
        this.resetTurnEndTimeout();
    }

    public get audioStream(): PullAudioOutputStreamImpl {
        // Called when is needed to stream.
        this.resetTurnEndTimeout();
        return this.privAudioStream;
    }

    public processActivityPayload(payload: ActivityPayloadResponse, audioFormat?: AudioOutputFormatImpl): PullAudioOutputStreamImpl {
        if (payload.messageDataStreamType === MessageDataStreamType.TextToSpeechAudio) {
            this.privAudioStream = AudioOutputStream.createPullStream() as PullAudioOutputStreamImpl;
            this.privAudioStream.format = (audioFormat !== undefined) ? audioFormat : AudioOutputFormatImpl.getDefaultOutputFormat();
        }
        return this.privAudioStream;
    }

    public endAudioStream(): void {
        if (this.privAudioStream !== null && !this.privAudioStream.isClosed) {
            this.privAudioStream.close();
        }
    }

    public complete(): void {
        if (this.privTimeoutToken !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            clearTimeout(this.privTimeoutToken);
        }
        this.endAudioStream();
    }

    private resetTurnEndTimeout(): void {
        if (this.privTimeoutToken !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            clearTimeout(this.privTimeoutToken);
        }
        this.privTimeoutToken = setTimeout((): void => {
            this.privTurnManager.CompleteTurn(this.privRequestId);
            return;
        }, 2000);
    }
}
