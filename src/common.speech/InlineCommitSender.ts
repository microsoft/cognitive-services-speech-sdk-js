// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    EventType,
    IConnection,
    IStringDictionary,
    MessageType,
} from "../common/Exports.js";
import { CommitChannelIndexHeaderName, commitTokenFromPhrase, CommitTokenHeaderName } from "./CommitToken.js";
import { InlineCommitTracker } from "./InlineCommitTracker.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

/**
 * Inline commit: the outbound side of inline commit for one recognizer. Sends audio.commit
 * messages, holds a commit until the turn has sent its first audio message, and keeps the
 * bookkeeping of unacknowledged commits (InlineCommitTracker) in step with the audio sent.
 *
 * The recognizer decides whether a commit read from the stream is handled at all (session
 * state, recognizer type); everything after that is here.
 */
export class InlineCommitSender {
    private privTracker: InlineCommitTracker = new InlineCommitTracker();
    // Whether the current turn has sent its first audio message (the wave header). A commit
    // sent before that would precede the turn it belongs to.
    private privTurnAudioStarted: boolean = false;
    // At most one commit is held: a later one supersedes it.
    private privHeldCommit: { token: number; channelId?: number } = undefined;
    // The request id is read when a message is actually sent, which for a held commit is
    // later than when it was requested.
    private privGetRequestId: () => string;

    public constructor(getRequestId: () => string) {
        this.privGetRequestId = getRequestId;
    }

    /**
     * The commit token of a final result message, or 0. The token is in the phrase object:
     * at the top level of speech.phrase and translation.phrase, and in the nested
     * SpeechPhrase of translation.response.
     */
    public static tokenFromMessage(message: SpeechConnectionMessage): number {
        const path: string = message.path.toLowerCase();
        if ((path !== "speech.phrase" && path !== "translation.phrase" && path !== "translation.response") ||
            message.messageType !== MessageType.Text || !message.textBody || message.textBody.indexOf("clientAudioMetadata") < 0) {
            return 0;
        }

        try {
            const body: { SpeechPhrase?: unknown } = JSON.parse(message.textBody) as { SpeechPhrase?: unknown };
            return commitTokenFromPhrase(path === "translation.response" ? body.SpeechPhrase : body);
        } catch {
            return 0;
        }
    }

    /**
     * Discards all commit state, at the start and end of a recognition.
     */
    public reset(reason: string): void {
        this.privTracker.reset(reason);
        this.dropHeldCommit(reason);
        this.privTurnAudioStarted = false;
    }

    /**
     * A new turn begins on the same connection; it opens with its wave header.
     */
    public onNewTurn(): void {
        this.privTurnAudioStarted = false;
    }

    /**
     * The turn ended or the connection was replaced. A held commit is dropped; if it is still
     * pending it is re-sent with the replayed audio.
     */
    public onTurnClosed(reason: string): void {
        this.dropHeldCommit(reason);
        this.privTurnAudioStarted = false;
    }

    /**
     * The turn has sent its first audio message. A held commit is released and queued on the
     * connection after that message.
     */
    public onTurnAudioStarted(connection: IConnection): void {
        this.privTurnAudioStarted = true;
        if (this.privHeldCommit !== undefined) {
            const held: { token: number; channelId?: number } = this.privHeldCommit;
            this.privHeldCommit = undefined;
            InlineCommitTracker.log(`sending held audio.commit token=${held.token} now that the turn has begun`, EventType.Debug);
            this.send(connection, held.token, held.channelId);
        }
    }

    /**
     * A commit read from the audio stream, at the given position, that the recognizer has
     * accepted. Sent unless the bookkeeping refuses it.
     */
    public onCommitRead(connection: IConnection, token: number, channelId: number | undefined, offsetBytes: number): void {
        if (this.privTracker.onCommitRead(token, channelId, offsetBytes)) {
            this.send(connection, token, channelId);
        }
    }

    /**
     * Audio up to the given position has been sent. Pending commits it has reached after a
     * replay are re-sent.
     */
    public onAudioSent(connection: IConnection, endBytes: number): void {
        this.privTracker.onAudioSent(endBytes);
        this.sendResendable(connection);
    }

    /**
     * Audio is being replayed from the given position (new connection or new turn). Pending
     * commits are re-placed relative to the replayed audio; those at its start go first.
     */
    public onReplay(connection: IConnection, replayStartBytes: number): void {
        if (this.privTracker.pendingCount > 0) {
            this.privTracker.onReplay(replayStartBytes);
            this.sendResendable(connection);
        } else {
            this.privTracker.onAudioSent(replayStartBytes);
        }
    }

    /**
     * A final result acknowledged the commit with the given token.
     */
    public onAcknowledged(token: number): void {
        this.privTracker.onAcknowledged(token);
    }

    private sendResendable(connection: IConnection): void {
        for (const commit of this.privTracker.takeResendable()) {
            InlineCommitTracker.log(`re-sending commit token=${commit.token}`, EventType.Debug);
            this.send(connection, commit.token, commit.channelId);
        }
    }

    // Sends an audio.commit (headers only) for the current turn, or holds it if the turn has
    // not sent its first audio message yet.
    private send(connection: IConnection, token: number, channelId?: number): void {
        if (!this.privTurnAudioStarted) {
            if (this.privHeldCommit !== undefined) {
                InlineCommitTracker.log(`dropping held audio.commit token=${this.privHeldCommit.token}: superseded by token ${token} before any audio was sent in the turn`, EventType.Warning);
            }
            InlineCommitTracker.log(`holding audio.commit token=${token} until the turn has sent audio`, EventType.Debug);
            this.privHeldCommit = { channelId, token };
            return;
        }

        const headers: IStringDictionary<string> = {};
        headers[CommitTokenHeaderName] = token.toString();
        if (channelId !== undefined) {
            headers[CommitChannelIndexHeaderName] = channelId.toString();
        }

        InlineCommitTracker.log(`sending audio.commit token=${token}`, EventType.Debug);
        connection.send(new SpeechConnectionMessage(
            MessageType.Text, "audio.commit", this.privGetRequestId(), null, "", undefined, headers)
        ).catch((error: string): void => {
            // The commit stays pending and is re-sent after a reconnect if still applicable.
            InlineCommitTracker.log(`failed to send audio.commit token=${token}: ${error}`, EventType.Warning);
        });
    }

    private dropHeldCommit(reason: string): void {
        if (this.privHeldCommit !== undefined) {
            InlineCommitTracker.log(`dropping held audio.commit token=${this.privHeldCommit.token}: ${reason}`, EventType.Warning);
            this.privHeldCommit = undefined;
        }
    }
}
