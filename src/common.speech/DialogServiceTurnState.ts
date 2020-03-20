// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {AudioOutputFormatImpl} from "../sdk/Audio/AudioOutputFormat";
import { AudioOutputStream, PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream";
import { DialogServiceTurnStateManager } from "./DialogServiceTurnStateManager";
import { ActivityPayloadResponse, MessageDataStreamType } from "./ServiceMessages/ActivityResponsePayload";

export class DialogServiceTurnState {
    private privRequestId: string;
    private privIsCompleted: boolean;
    private privAudioStream: PullAudioOutputStreamImpl;
    private privTimeoutToken: any;
    private privTurnManager: DialogServiceTurnStateManager;

    constructor(manager: DialogServiceTurnStateManager, requestId: string) {
        this.privRequestId = requestId;
        this.privIsCompleted = false;
        this.privAudioStream = null;
        this.privTurnManager = manager;
        this.resetTurnEndTimeout();
        // tslint:disable-next-line:no-console
        // console.info("DialogServiceTurnState debugturn start:" + this.privRequestId);
    }

    public get audioStream(): PullAudioOutputStreamImpl {
        // Called when is needed to stream.
        this.resetTurnEndTimeout();
        return this.privAudioStream;
    }

    public processActivityPayload(payload: ActivityPayloadResponse): PullAudioOutputStreamImpl {
        if (payload.messageDataStreamType === MessageDataStreamType.TextToSpeechAudio) {
            this.privAudioStream = AudioOutputStream.createPullStream() as PullAudioOutputStreamImpl;
            this.privAudioStream.format = AudioOutputFormatImpl.getDefaultOutputFormat();
            // tslint:disable-next-line:no-console
            // console.info("Audio start debugturn:" + this.privRequestId);
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
            clearTimeout(this.privTimeoutToken);
        }
        this.endAudioStream();
    }

    private resetTurnEndTimeout(): void {
        if (this.privTimeoutToken !== undefined) {
            clearTimeout(this.privTimeoutToken);
        }
        // tslint:disable-next-line:no-console
        // console.info("Timeout reset debugturn:" + this.privRequestId);

        this.privTimeoutToken = setTimeout((): void => {
            // tslint:disable-next-line:no-console
            // console.info("Timeout complete debugturn:" + this.privRequestId);

            this.privTurnManager.CompleteTurn(this.privRequestId);
            return;
        }, 2000);
    }
}
