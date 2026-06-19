// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IStringDictionary } from "../common/Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import { CtsAudioContinuation } from "./ServiceMessages/MultichannelAudio/CtsAudioContinuation.js";
import { CtsAudioInfo } from "./ServiceMessages/MultichannelAudio/CtsAudioInfo.js";
import { CtsAudioStream } from "./ServiceMessages/MultichannelAudio/CtsAudioStream.js";

/**
 * Tracks the per-turn state required by the reliable reconnect protocol.
 *
 * The service issues a continuation token, per-stream resume offsets and a service tag on its
 * responses. When a turn is interrupted before "turn.end", the client echoes these values back
 * in the next "speech.context" so the service can suppress duplicate results, correct media
 * offsets and correlate the reconnected turn.
 *
 * Intentionally dependency-free so it can be unit tested in isolation.
 */
export class ReconnectContinuationState {
    private privToken?: string;
    private privServiceTag?: string;
    private privStreamOffset?: number;
    private readonly privDefaultStreamId: string;

    public constructor(defaultStreamId: string = "1") {
        this.privDefaultStreamId = defaultStreamId;
    }

    /**
     * The stream id used for the single logical audio stream the SDK currently sends.
     */
    public get defaultStreamId(): string {
        return this.privDefaultStreamId;
    }

    /**
     * The session-absolute resume offset (100ns ticks) most recently acknowledged by the
     * service, or undefined if none has arrived. Mirrors Carbon's g_audioContinuationOffset;
     * used both to populate the outgoing continuation block and to trim the replay buffer.
     */
    public get streamOffset(): number | undefined {
        return this.privStreamOffset;
    }

    /**
     * True when the continuation block must be emitted. Mirrors Carbon's AddAudioJsonToContext,
     * which emits the block whenever any of the three signals is present (token, service tag or
     * stream offset). The signals persist for the whole session, so the block keeps being
     * emitted on reconnects and subsequent turns once the first turn.start has been seen.
     */
    public get hasPendingContinuation(): boolean {
        return this.privToken !== undefined
            || this.privServiceTag !== undefined
            || this.privStreamOffset !== undefined;
    }

    /**
     * Resets all state. Called when a brand new recognition (session) starts.
     */
    public reset(): void {
        this.privToken = undefined;
        this.privServiceTag = undefined;
        this.privStreamOffset = undefined;
    }

    /**
     * A turn has started ("turn.start"). The service tag arrives in the turn.start body (under
     * "$.context.serviceTag"), not a header. Matching Carbon, the tag is stored unconditionally
     * (empty string when absent) and the token/offset are NOT cleared: the offset is
     * session-global and the token persists until the service issues a new one.
     */
    public onTurnStart(serviceTag?: string): void {
        this.privServiceTag = serviceTag ?? "";
    }

    /**
     * Captures the reliable-reconnect headers (continuation token and stream resume offset)
     * from an inbound message. Header names are case-insensitive, so matching is too. The
     * service tag is not a header; it comes from the turn.start body via onTurnStart().
     *
     * The per-stream offset header is turn-relative. Like Carbon (offset + m_startingOffset),
     * it is rebased onto the session-absolute timeline using `turnStartOffset`
     * (RequestSession.currentTurnAudioOffset) - the same base used to rebase every other
     * service offset - so the stored offset stays in the same frame as results and replay.
     */
    public updateFromHeaders(headers: IStringDictionary<string>, turnStartOffset: number = 0): void {
        if (!headers) {
            return;
        }

        const tokenHeader = HeaderNames.ContinuationToken.toLowerCase();
        const offsetHeader = HeaderNames.ContinuationAudioStreamOffset.toLowerCase();

        for (const headerName in headers) {
            if (!headerName) {
                continue;
            }
            const lowerName = headerName.toLowerCase();
            const value = headers[headerName];

            if (lowerName === tokenHeader) {
                this.privToken = value;
            } else if (lowerName === offsetHeader) {
                const relativeOffset = parseInt(value, 10);
                if (!isNaN(relativeOffset)) {
                    // Rebase onto the session-absolute timeline and store only when it advances,
                    // so an out-of-order offset never regresses the resume position.
                    const absoluteOffset = turnStartOffset + relativeOffset;
                    if (this.privStreamOffset === undefined || absoluteOffset > this.privStreamOffset) {
                        this.privStreamOffset = absoluteOffset;
                    }
                }
            }
        }
    }

    /**
     * Builds the "$.audio.streams" metadata section. This is always sent when the feature is
     * enabled and is the prerequisite for the service to return continuation headers.
     */
    public buildAudioStreamsMetadata(): CtsAudioInfo {
        const streams: Record<string, CtsAudioStream | null> = {};
        // Carbon opts the stream in with "<id>":null (not an empty object); only the null marker
        // enables the continuation contract service-side.
        streams[this.privDefaultStreamId] = null;
        return { streams };
    }

    /**
     * Builds the "$.continuation" section to resume an aborted turn, or undefined when this
     * is a fresh turn (and therefore must not carry a continuation).
     */
    public buildContinuationContext(): CtsAudioContinuation | undefined {
        if (!this.hasPendingContinuation) {
            return undefined;
        }

        // Carbon always emits "token" and "previousServiceTag" (defaulting to "") and adds the
        // audio stream offset only when one is known.
        const continuation: CtsAudioContinuation = {
            previousServiceTag: this.privServiceTag ?? "",
            token: this.privToken ?? ""
        };

        if (this.privStreamOffset !== undefined) {
            continuation.audio = {
                streams: { [this.privDefaultStreamId]: { offset: this.privStreamOffset } }
            };
        }

        return continuation;
    }
}
