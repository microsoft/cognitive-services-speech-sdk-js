// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Inline commit: offline tests for parsing the echoed commit token, for the bookkeeping
// of unacknowledged commits, and for sending and holding audio.commit messages. No service
// connection is needed.

import {
    ConnectionMessage,
    IConnection,
    MessageType,
} from "../src/common/Exports";
import {
    commitTokenFromJson,
    commitTokenFromPhrase,
} from "../src/common.speech/CommitToken";
import { InlineCommitSender } from "../src/common.speech/InlineCommitSender";
import { InlineCommitTracker } from "../src/common.speech/InlineCommitTracker";
import { SpeechConnectionMessage } from "../src/common.speech/SpeechConnectionMessage.Internal";

const phraseWith = (metadata: unknown): { [key: string]: unknown } => ({
    DisplayText: "",
    RecognitionStatus: "Success",
    clientAudioMetadata: metadata,
});

describe("Commit token parsing", (): void => {
    test("Token is read from clientAudioMetadata", (): void => {
        expect(commitTokenFromPhrase(phraseWith({ "X-Client-Commit-Token": "7" }))).toEqual(7);
        expect(commitTokenFromJson(JSON.stringify(phraseWith({ "X-Client-Commit-Token": "7" })))).toEqual(7);
    });

    test("Other X-Client entries are ignored", (): void => {
        expect(commitTokenFromPhrase(phraseWith({ "X-Client-Commit-Token": "3", "X-Client-Other": "x" }))).toEqual(3);
        expect(commitTokenFromPhrase(phraseWith({ "X-Client-Other": "x" }))).toEqual(0);
    });

    test("No metadata means not an acknowledgment", (): void => {
        expect(commitTokenFromPhrase({ DisplayText: "hello" })).toEqual(0);
        expect(commitTokenFromJson("{\"DisplayText\":\"hello\"}")).toEqual(0);
        expect(commitTokenFromPhrase(undefined)).toEqual(0);
        expect(commitTokenFromPhrase(null)).toEqual(0);
        expect(commitTokenFromPhrase("clientAudioMetadata")).toEqual(0);
        expect(commitTokenFromJson(undefined)).toEqual(0);
        expect(commitTokenFromJson("")).toEqual(0);
    });

    test("Metadata that is not an object is ignored", (): void => {
        expect(commitTokenFromPhrase(phraseWith(null))).toEqual(0);
        expect(commitTokenFromPhrase(phraseWith("X-Client-Commit-Token"))).toEqual(0);
        expect(commitTokenFromPhrase(phraseWith([{ "X-Client-Commit-Token": "1" }]))).toEqual(0);
    });

    test("Token values that are not a decimal string are ignored", (): void => {
        for (const value of [1, true, null, "", "abc", "1a", "-1", "+1", " 1", "1.0", "0x10"]) {
            expect(commitTokenFromPhrase(phraseWith({ "X-Client-Commit-Token": value }))).toEqual(0);
        }
    });

    test("Token range is uint32", (): void => {
        expect(commitTokenFromPhrase(phraseWith({ "X-Client-Commit-Token": "4294967295" }))).toEqual(4294967295);
        expect(commitTokenFromPhrase(phraseWith({ "X-Client-Commit-Token": "4294967296" }))).toEqual(0);
        expect(commitTokenFromPhrase(phraseWith({ "X-Client-Commit-Token": "0" }))).toEqual(0);
    });

    test("Oversized metadata is ignored", (): void => {
        const small: { [key: string]: string } = { "X-Client-Commit-Token": "5", "X-Client-Pad": "x".repeat(3000) };
        expect(commitTokenFromPhrase(phraseWith(small))).toEqual(5);
        const large: { [key: string]: string } = { "X-Client-Commit-Token": "5", "X-Client-Pad": "x".repeat(5000) };
        expect(commitTokenFromPhrase(phraseWith(large))).toEqual(0);
    });

    test("Invalid JSON is ignored", (): void => {
        expect(commitTokenFromJson("{\"clientAudioMetadata\": {")).toEqual(0);
    });

    test("Token in a nested object is not read from the top level", (): void => {
        // translation.response nests the phrase in SpeechPhrase; the caller passes that object.
        const response: { [key: string]: unknown } = { SpeechPhrase: phraseWith({ "X-Client-Commit-Token": "9" }) };
        expect(commitTokenFromPhrase(response)).toEqual(0);
        expect(commitTokenFromPhrase(response.SpeechPhrase)).toEqual(9);
    });
});

describe("Inline commit tracker", (): void => {
    test("Acknowledged commit is removed", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        expect(t.onCommitRead(1, undefined, 0)).toEqual(true);
        expect(t.pendingCount).toEqual(1);
        t.onAcknowledged(1);
        expect(t.pendingCount).toEqual(0);
    });

    test("Acknowledgment discards older unacknowledged commits", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        t.onCommitRead(1, undefined, 0);
        t.onCommitRead(2, undefined, 100);
        t.onCommitRead(3, undefined, 200);
        t.onAcknowledged(2);
        expect(t.pendingCount).toEqual(1);
        t.onAcknowledged(3);
        expect(t.pendingCount).toEqual(0);
    });

    test("Repeated and unknown acknowledgments leave the pending commits alone", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        t.onCommitRead(1, undefined, 0);
        t.onCommitRead(2, undefined, 100);
        t.onAcknowledged(1);
        // Second acknowledgment of a multichannel commit.
        t.onAcknowledged(1);
        expect(t.pendingCount).toEqual(1);
        t.onAcknowledged(1000);
        expect(t.pendingCount).toEqual(0);
    });

    test("Pending commits are capped at 64", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        for (let token = 1; token <= 64; token++) {
            expect(t.onCommitRead(token, undefined, token)).toEqual(true);
        }
        expect(t.onCommitRead(65, undefined, 65)).toEqual(false);
        expect(t.pendingCount).toEqual(64);
        // Room is made by an acknowledgment.
        t.onAcknowledged(1);
        expect(t.onCommitRead(66, undefined, 66)).toEqual(true);
    });

    test("Reset discards all pending commits", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        t.onCommitRead(1, undefined, 0);
        t.onCommitRead(2, undefined, 100);
        t.reset("test");
        expect(t.pendingCount).toEqual(0);
        expect(t.takeResendable()).toEqual([]);
    });

    test("Nothing is re-sent without a replay", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        t.onCommitRead(1, undefined, 100);
        t.onAudioSent(1000);
        expect(t.takeResendable()).toEqual([]);
    });

    test("Replay discards commits before the replay start and re-sends the rest in place", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        t.onAudioSent(1000);
        t.onCommitRead(1, undefined, 100);  // X < Y: obsolete
        t.onCommitRead(2, 3, 400);          // X = Y: before any replayed audio
        t.onCommitRead(3, undefined, 700);  // X > Y: once the replay reaches it
        t.onCommitRead(4, undefined, 900);

        t.onReplay(400);
        expect(t.pendingCount).toEqual(3);
        expect(t.takeResendable()).toEqual([{ channelId: 3, token: 2 }]);

        t.onAudioSent(600);
        expect(t.takeResendable()).toEqual([]);
        t.onAudioSent(900);
        expect(t.takeResendable()).toEqual([{ channelId: undefined, token: 3 }, { channelId: undefined, token: 4 }]);

        // Each is re-sent once per replay.
        t.onAudioSent(1000);
        expect(t.takeResendable()).toEqual([]);
    });

    test("A second replay re-sends pending commits again", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        t.onAudioSent(500);
        t.onCommitRead(1, undefined, 300);
        t.onReplay(0);
        t.onAudioSent(500);
        expect(t.takeResendable()).toEqual([{ channelId: undefined, token: 1 }]);
        t.onReplay(200);
        t.onAudioSent(300);
        expect(t.takeResendable()).toEqual([{ channelId: undefined, token: 1 }]);
    });

    test("Acknowledged commits are not re-sent after a replay", (): void => {
        const t: InlineCommitTracker = new InlineCommitTracker();
        t.onAudioSent(500);
        t.onCommitRead(1, undefined, 200);
        t.onCommitRead(2, undefined, 400);
        t.onAcknowledged(1);
        t.onReplay(100);
        t.onAudioSent(500);
        expect(t.takeResendable()).toEqual([{ channelId: undefined, token: 2 }]);
    });
});

describe("Inline commit sender", (): void => {
    // Records the audio.commit messages sent, as "token" or "token/channel", with the
    // request id current at the time of sending.
    const makeConnection = (): { connection: IConnection; sent: string[] } => {
        const sent: string[] = [];
        const connection: IConnection = {
            send: (message: ConnectionMessage): Promise<void> => {
                const m: SpeechConnectionMessage = message as SpeechConnectionMessage;
                expect(m.path).toEqual("audio.commit");
                expect(m.messageType).toEqual(MessageType.Text);
                const token: string = m.additionalHeaders["X-Client-Commit-Token"];
                const channel: string = m.additionalHeaders["X-Client-Commit-Channel-Index"];
                sent.push(`${token}${channel !== undefined ? `/${channel}` : ""}@${m.requestId}`);
                return Promise.resolve();
            },
        } as unknown as IConnection;
        return { connection, sent };
    };

    const makeSender = (): { sender: InlineCommitSender; setRequestId: (id: string) => void } => {
        let requestId: string = "r1";
        const sender: InlineCommitSender = new InlineCommitSender((): string => requestId);
        return { sender, setRequestId: (id: string): void => {
            requestId = id;
        } };
    };

    test("Commit is sent once the turn has sent audio", (): void => {
        const { connection, sent } = makeConnection();
        const { sender } = makeSender();
        sender.onTurnAudioStarted(connection);
        sender.onCommitRead(connection, 1, undefined, 100);
        sender.onCommitRead(connection, 2, 3, 200);
        expect(sent).toEqual(["1@r1", "2/3@r1"]);
    });

    test("Commit before the turn has sent audio is held, then sent with the current request id", (): void => {
        const { connection, sent } = makeConnection();
        const { sender, setRequestId } = makeSender();
        sender.onCommitRead(connection, 1, undefined, 0);
        expect(sent).toEqual([]);
        setRequestId("r2");
        sender.onTurnAudioStarted(connection);
        expect(sent).toEqual(["1@r2"]);
        // Released once only.
        sender.onTurnAudioStarted(connection);
        expect(sent).toEqual(["1@r2"]);
    });

    test("A later held commit supersedes an earlier one", (): void => {
        const { connection, sent } = makeConnection();
        const { sender } = makeSender();
        sender.onCommitRead(connection, 1, undefined, 0);
        sender.onCommitRead(connection, 2, undefined, 0);
        sender.onTurnAudioStarted(connection);
        expect(sent).toEqual(["2@r1"]);
    });

    test("A held commit is dropped when the turn closes or the sender is reset", (): void => {
        const { connection, sent } = makeConnection();
        const { sender } = makeSender();
        sender.onCommitRead(connection, 1, undefined, 0);
        sender.onTurnClosed("test");
        sender.onTurnAudioStarted(connection);
        expect(sent).toEqual([]);

        sender.onNewTurn();
        sender.onCommitRead(connection, 2, undefined, 0);
        sender.reset("test");
        sender.onTurnAudioStarted(connection);
        expect(sent).toEqual([]);
    });

    test("A new turn holds commits until it has sent audio", (): void => {
        const { connection, sent } = makeConnection();
        const { sender } = makeSender();
        sender.onTurnAudioStarted(connection);
        sender.onNewTurn();
        sender.onCommitRead(connection, 1, undefined, 0);
        expect(sent).toEqual([]);
        sender.onTurnAudioStarted(connection);
        expect(sent).toEqual(["1@r1"]);
    });

    test("Pending commits are re-sent at their position in the replayed audio", (): void => {
        const { connection, sent } = makeConnection();
        const { sender } = makeSender();
        sender.onTurnAudioStarted(connection);
        sender.onAudioSent(connection, 1000);
        sender.onCommitRead(connection, 1, undefined, 400);
        sender.onCommitRead(connection, 2, undefined, 800);
        sent.length = 0;

        // Reconnect: the new connection's turn opens, then audio is replayed from 400.
        sender.onTurnClosed("test");
        sender.onTurnAudioStarted(connection);
        sender.onReplay(connection, 400);
        expect(sent).toEqual(["1@r1"]);
        sender.onAudioSent(connection, 600);
        expect(sent).toEqual(["1@r1"]);
        sender.onAudioSent(connection, 800);
        expect(sent).toEqual(["1@r1", "2@r1"]);
    });

    test("Acknowledged commits are not re-sent", (): void => {
        const { connection, sent } = makeConnection();
        const { sender } = makeSender();
        sender.onTurnAudioStarted(connection);
        sender.onAudioSent(connection, 1000);
        sender.onCommitRead(connection, 1, undefined, 400);
        sender.onAcknowledged(1);
        sent.length = 0;
        sender.onReplay(connection, 0);
        sender.onAudioSent(connection, 1000);
        expect(sent).toEqual([]);
    });

    test("Commit token is read from final result messages only", (): void => {
        const body: string = JSON.stringify({ clientAudioMetadata: { "X-Client-Commit-Token": "7" }, DisplayText: "" });
        const message = (path: string, text: string, type: MessageType = MessageType.Text): SpeechConnectionMessage =>
            new SpeechConnectionMessage(type, path, "r1", "application/json", text);
        expect(InlineCommitSender.tokenFromMessage(message("speech.phrase", body))).toEqual(7);
        expect(InlineCommitSender.tokenFromMessage(message("Speech.Phrase", body))).toEqual(7);
        expect(InlineCommitSender.tokenFromMessage(message("translation.phrase", body))).toEqual(7);
        expect(InlineCommitSender.tokenFromMessage(message("translation.response", JSON.stringify({ SpeechPhrase: JSON.parse(body) as unknown })))).toEqual(7);
        expect(InlineCommitSender.tokenFromMessage(message("translation.response", body))).toEqual(0);
        expect(InlineCommitSender.tokenFromMessage(message("speech.hypothesis", body))).toEqual(0);
        expect(InlineCommitSender.tokenFromMessage(message("speech.phrase", "{\"DisplayText\":\"x\"}"))).toEqual(0);
        expect(InlineCommitSender.tokenFromMessage(message("speech.phrase", "{\"clientAudioMetadata\": {"))).toEqual(0);
    });
});
