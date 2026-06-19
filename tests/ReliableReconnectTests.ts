// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Unit tests for the reliable reconnect protocol support.
 *
 *   1. ReconnectContinuationState — the dependency-free state machine that captures the
 *      service continuation headers and produces the speech.context sections.
 *   2. ServiceRecognizerBase.applyReconnectContinuation — that the recognizer injects the
 *      "$.audio.streams" marker and the "$.continuation" section at the right times.
 *
 * No live service is required. The recognizer harness mirrors SpeechContextSetterTests.ts:
 * it builds a bare ServiceRecognizerBase from the prototype and wires only the fields the
 * code under test touches, mocking the modules that trigger circular-dependency chains.
 */

// Break the barrel-export circular dependency chains before any imports.
jest.mock("../src/sdk/Audio/AudioConfig", () => ({}));
jest.mock("../src/sdk/Audio/AudioInputStream", () => ({}));
jest.mock("../src/sdk/Audio/AudioOutputStream", () => ({}));
jest.mock("../src/common.browser/Exports", () => ({}));
jest.mock("../src/common.speech/Transcription/Exports", () => ({}));

// Import direct files first to prime the module cache and avoid the barrel-export
// circular-initialization order issue (same approach as SpeechContextSetterTests.ts).
import { PropertyCollection } from "../src/sdk/PropertyCollection";
import { PropertyId } from "../src/sdk/PropertyId";
import { DynamicGrammarBuilder } from "../src/common.speech/DynamicGrammarBuilder";
import { ReconnectContinuationState } from "../src/common.speech/ReconnectContinuationState";
import { SpeechContext } from "../src/common.speech/SpeechContext";
import { ServiceRecognizerBase } from "../src/common.speech/ServiceRecognizerBase";
import { SpeechContext as SpeechServiceContext } from "../src/common.speech/ServiceMessages/SpeechContext";
import { Settings } from "./Settings";

// Reference the primed imports so eslint/tsc do not flag them as unused.
void PropertyCollection;
void PropertyId;

beforeAll((): void => {
    Settings.LoadSettings();
});

// eslint-disable-next-line no-console
beforeEach((): void => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

// ---------------------------------------------------------------------------
// ReconnectContinuationState
// ---------------------------------------------------------------------------
describe("ReconnectContinuationState", (): void => {

    it("emits the audio.streams marker for the default stream id", (): void => {
        const state = new ReconnectContinuationState();
        expect(state.defaultStreamId).toEqual("1");
        expect(state.buildAudioStreamsMetadata()).toEqual({ streams: { 1: null } });
    });

    it("has no pending continuation before the first turn.start", (): void => {
        const state = new ReconnectContinuationState();
        expect(state.hasPendingContinuation).toEqual(false);
        expect(state.buildContinuationContext()).toBeUndefined();
    });

    it("emits the continuation once a turn.start has been seen, even before any token", (): void => {
        // Matching Carbon, the service tag stored on turn.start is enough to make the
        // continuation block present; the token then defaults to "" and the offset is omitted
        // until one is known.
        const state = new ReconnectContinuationState();
        state.onTurnStart("svc-tag");
        expect(state.hasPendingContinuation).toEqual(true);
        expect(state.buildContinuationContext()).toEqual({
            token: "",
            previousServiceTag: "svc-tag"
        });
    });

    it("captures token and per-stream offset from headers, and service tag from turn.start", (): void => {
        const state = new ReconnectContinuationState();
        state.onTurnStart("svc-tag-1");
        state.updateFromHeaders({
            "X-Continuation-Token": "token-A2",
            "X-Continuation-Audio-Streams-1-Offset": "2000000"
        });

        expect(state.hasPendingContinuation).toEqual(true);
        expect(state.buildContinuationContext()).toEqual({
            token: "token-A2",
            audio: { streams: { 1: { offset: 2000000 } } },
            previousServiceTag: "svc-tag-1"
        });
    });

    it("matches headers case-insensitively", (): void => {
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag");
        state.updateFromHeaders({
            "x-continuation-token": "lower",
            "X-CONTINUATION-AUDIO-STREAMS-1-OFFSET": "42"
        });

        expect(state.buildContinuationContext()).toEqual({
            token: "lower",
            audio: { streams: { 1: { offset: 42 } } },
            previousServiceTag: "tag"
        });
    });

    it("omits the stream offset when no offset header arrived", (): void => {
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag");
        state.updateFromHeaders({ "X-Continuation-Token": "t" });

        // Matching Carbon, the audio offset is only added when a stream offset is known.
        expect(state.buildContinuationContext()).toEqual({
            token: "t",
            previousServiceTag: "tag"
        });
    });

    it("keeps the continuation across a mid-turn drop (no turn.end)", (): void => {
        const state = new ReconnectContinuationState();
        state.onTurnStart();
        state.updateFromHeaders({ "X-Continuation-Token": "t", "X-Continuation-Audio-Streams-1-Offset": "5" });

        // The continuation state is never cleared mid-turn, so it survives an abrupt
        // disconnect to be replayed on the reconnect's speech.context.
        expect(state.hasPendingContinuation).toEqual(true);
        expect(state.buildContinuationContext()?.token).toEqual("t");
    });

    it("persists token and offset across a new turn.start, updating only the service tag", (): void => {
        // Matching Carbon, turn.start does not clear the token or the session-global offset;
        // it only overwrites the stored service tag with the new turn's value.
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag-1");
        state.updateFromHeaders({ "X-Continuation-Token": "turn1", "X-Continuation-Audio-Streams-1-Offset": "5" });

        state.onTurnStart("tag-2");
        expect(state.hasPendingContinuation).toEqual(true);
        expect(state.buildContinuationContext()).toEqual({
            token: "turn1",
            audio: { streams: { 1: { offset: 5 } } },
            previousServiceTag: "tag-2"
        });
    });

    it("reset clears everything", (): void => {
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag");
        state.updateFromHeaders({ "X-Continuation-Token": "t" });

        state.reset();
        expect(state.hasPendingContinuation).toEqual(false);
        expect(state.buildContinuationContext()).toBeUndefined();
    });

    it("ignores malformed offset headers", (): void => {
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag");
        state.updateFromHeaders({
            "X-Continuation-Token": "t",
            "X-Continuation-Audio-Streams-1-Offset": "notanumber"
        });

        // The non-numeric offset is ignored; with no known offset the audio section is omitted.
        expect(state.buildContinuationContext()?.audio).toBeUndefined();
    });

    it("rebases the turn-relative offset header onto the session-absolute timeline", (): void => {
        // Carbon treats the per-stream offset header as turn-relative and adds the turn-start
        // base (m_startingOffset) before storing it. The SDK passes currentTurnAudioOffset as
        // that base, so a header of 100 on a turn that began at 5000 resolves to 5100.
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag");
        state.updateFromHeaders({ "X-Continuation-Audio-Streams-1-Offset": "100" }, 5000);

        expect(state.streamOffset).toEqual(5100);
        expect(state.buildContinuationContext()?.audio).toEqual({ streams: { 1: { offset: 5100 } } });
    });

    it("keeps the absolute offset monotonic across a turn boundary", (): void => {
        // Turn 1 ends at absolute 5000; turn 2's header is turn-relative (100) rebased to 5100,
        // which advances past 5000 and is stored. A later, smaller absolute value is ignored.
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag-1");
        state.updateFromHeaders({ "X-Continuation-Audio-Streams-1-Offset": "5000" }, 0);
        expect(state.streamOffset).toEqual(5000);

        state.onTurnStart("tag-2");
        state.updateFromHeaders({ "X-Continuation-Audio-Streams-1-Offset": "100" }, 5000);
        expect(state.streamOffset).toEqual(5100);

        // An out-of-order header that rebases below the stored value never regresses the offset.
        state.updateFromHeaders({ "X-Continuation-Audio-Streams-1-Offset": "10" }, 0);
        expect(state.streamOffset).toEqual(5100);
    });

    it("exposes undefined streamOffset until an offset header arrives", (): void => {
        const state = new ReconnectContinuationState();
        state.onTurnStart("tag");
        expect(state.streamOffset).toBeUndefined();

        state.updateFromHeaders({ "X-Continuation-Token": "t" });
        expect(state.streamOffset).toBeUndefined();

        state.updateFromHeaders({ "X-Continuation-Audio-Streams-1-Offset": "7" });
        expect(state.streamOffset).toEqual(7);
    });
});

// ---------------------------------------------------------------------------
// ServiceRecognizerBase wiring
// ---------------------------------------------------------------------------
interface TestableRecognizer {
    privSpeechContext: SpeechContext;
    privContinuationState: ReconnectContinuationState;
    privEnableReliableReconnect: boolean;
    applyReconnectContinuation(): void;
}

function createTestRecognizer(): TestableRecognizer {
    const instance = Object.create(ServiceRecognizerBase.prototype) as TestableRecognizer;
    instance.privSpeechContext = new SpeechContext(new DynamicGrammarBuilder());
    instance.privContinuationState = new ReconnectContinuationState();
    instance.privEnableReliableReconnect = true;
    return instance;
}

function getContext(rec: TestableRecognizer): SpeechServiceContext {
    return rec.privSpeechContext.getContext();
}

describe("ServiceRecognizerBase reliable reconnect wiring", (): void => {

    it("injects audio.streams but no continuation on a fresh turn", (): void => {
        const rec = createTestRecognizer();
        rec.applyReconnectContinuation();

        expect(getContext(rec).audio).toEqual({ streams: { 1: null } });
        expect(getContext(rec).continuation).toBeUndefined();
    });

    it("injects the continuation section when resuming an aborted turn", (): void => {
        const rec = createTestRecognizer();
        rec.privContinuationState.onTurnStart("prev-tag");
        rec.privContinuationState.updateFromHeaders({
            "X-Continuation-Token": "tok",
            "X-Continuation-Audio-Streams-1-Offset": "2000000"
        });

        rec.applyReconnectContinuation();

        expect(getContext(rec).audio).toEqual({ streams: { 1: null } });
        expect(getContext(rec).continuation).toEqual({
            token: "tok",
            audio: { streams: { 1: { offset: 2000000 } } },
            previousServiceTag: "prev-tag"
        });
    });

    it("keeps the continuation section across turn boundaries (Carbon parity)", (): void => {
        const rec = createTestRecognizer();
        rec.privContinuationState.onTurnStart("tag");
        rec.privContinuationState.updateFromHeaders({ "X-Continuation-Token": "tok" });
        rec.applyReconnectContinuation();
        expect(getContext(rec).continuation).toBeDefined();

        // A subsequent turn.start does not retire the continuation; it persists for the
        // session so it is still echoed on the next speech.context.
        rec.privContinuationState.onTurnStart("tag-2");
        rec.applyReconnectContinuation();
        expect(getContext(rec).continuation).toEqual({
            token: "tok",
            previousServiceTag: "tag-2"
        });
        expect(getContext(rec).audio).toEqual({ streams: { 1: null } });
    });
});
