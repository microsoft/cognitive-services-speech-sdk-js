// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    Events,
    EventType,
    PlatformEvent
} from "../common/Exports.js";

interface IPendingCommit {
    token: number;
    channelId?: number;
    // Position of the commit: bytes of audio read before it, in the audio node's domain.
    offsetBytes: number;
    needsResend: boolean;
}

/**
 * Inline commit: bookkeeping of commits sent but not yet acknowledged, for one
 * recognition session. Decides which commits are re-sent after a reconnect, and where.
 */
export class InlineCommitTracker {
    private static readonly MaxPendingCommits: number = 64;

    private privPending: IPendingCommit[] = [];
    // Position of the end of the audio sent on the current connection or turn.
    private privSentBytes: number = 0;

    public static log(message: string, eventType: EventType): void {
        Events.instance.onEvent(new PlatformEvent(`InlineCommit: ${message}`, eventType));
    }

    public get pendingCount(): number {
        return this.privPending.length;
    }

    /**
     * Discards all pending commits, e.g. at session teardown.
     */
    public reset(reason: string): void {
        for (const entry of this.privPending) {
            InlineCommitTracker.log(`commit token=${entry.token} unacknowledged at ${reason}: discarded`, EventType.Warning);
        }
        this.privPending = [];
        this.privSentBytes = 0;
    }

    /**
     * Records a commit read from the audio stream. Returns false if it must not be sent.
     */
    public onCommitRead(token: number, channelId: number | undefined, offsetBytes: number): boolean {
        if (this.privPending.length >= InlineCommitTracker.MaxPendingCommits) {
            InlineCommitTracker.log(`unacknowledged commits at cap (${InlineCommitTracker.MaxPendingCommits}); discarding commit token=${token}`, EventType.Error);
            return false;
        }

        if (offsetBytes > this.privSentBytes) {
            InlineCommitTracker.log(`commit token=${token} anchored at ${offsetBytes} bytes is ahead of the ${this.privSentBytes} bytes sent`, EventType.Warning);
        }

        this.privPending.push({ channelId, needsResend: false, offsetBytes, token });
        return true;
    }

    /**
     * Audio is about to be replayed from startBytes, on a new connection or in a new turn.
     * Commits before that point are obsolete: the service has processed audio past them.
     * The others are re-sent when the replayed audio reaches their position.
     */
    public onReplay(startBytes: number): void {
        this.privSentBytes = startBytes;
        this.privPending = this.privPending.filter((entry: IPendingCommit): boolean => {
            if (entry.offsetBytes < startBytes) {
                InlineCommitTracker.log(`discarding commit token=${entry.token} at ${entry.offsetBytes} bytes: audio past it was already acknowledged (resume at ${startBytes} bytes)`, EventType.Warning);
                return false;
            }
            entry.needsResend = true;
            return true;
        });
    }

    /**
     * Audio has been sent up to endBytes.
     */
    public onAudioSent(endBytes: number): void {
        this.privSentBytes = endBytes;
    }

    /**
     * Returns the commits to re-send now that the audio before them has been sent, in order.
     */
    public takeResendable(): { token: number; channelId?: number }[] {
        const ready: { token: number; channelId?: number }[] = [];
        for (const entry of this.privPending) {
            if (entry.needsResend && entry.offsetBytes <= this.privSentBytes) {
                entry.needsResend = false;
                ready.push({ channelId: entry.channelId, token: entry.token });
            }
        }
        return ready;
    }

    /**
     * A result carrying the token was received. Earlier tokens will not be acknowledged,
     * since the service processes commits in order on a connection.
     */
    public onAcknowledged(token: number): void {
        while (this.privPending.length > 0 && this.privPending[0].token < token) {
            InlineCommitTracker.log(`discarding older unacknowledged commit token=${this.privPending[0].token} (acknowledgment arrived for token ${token})`, EventType.Warning);
            this.privPending.shift();
        }

        if (this.privPending.length === 0 || this.privPending[0].token !== token) {
            // Expected for the second and later acknowledgments of a multichannel commit.
            InlineCommitTracker.log(`no unacknowledged commit matches token=${token}`, EventType.Debug);
            return;
        }

        this.privPending.shift();
        InlineCommitTracker.log(`acknowledged token=${token}`, EventType.Debug);
    }
}
