// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import {
    Events,
    EventType
} from "../src/common/Exports";

import { Settings } from "./Settings";
import { closeAsyncObjects, WaitForCondition } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

function sleep(milliseconds: number): Promise<any> {
    return new Promise((resolve: any) => setTimeout(resolve, milliseconds));
}

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

// Test cases are run linerally, still looking for a way to get the test name to print that doesn't mean changing each test.
beforeEach(() => {
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
    // tslint:disable-next-line:no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

afterEach(async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
    done();
});

const CreateConversation: (speechConfig?: sdk.SpeechTranslationConfig) => sdk.Conversation = (speechConfig?: sdk.SpeechTranslationConfig): sdk.Conversation => {
    let s: sdk.SpeechTranslationConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const randomId = Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    const c: sdk.Conversation = sdk.Conversation.createConversationAsync(s, randomId);
    expect(c).not.toBeUndefined();

    return c;
};

const BuildSpeechConfig: () => sdk.SpeechTranslationConfig = (): sdk.SpeechTranslationConfig => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeakerIDSubscriptionKey, Settings.SpeakerIDRegion);
    expect(s).not.toBeUndefined();
    return s;
};

const BuildTranscriber: () => sdk.ConversationTranscriber = (): sdk.ConversationTranscriber => {

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile8ch);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const t: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(config);
    expect(t).not.toBeUndefined();

    return t;
};

const BuildMonoWaveTranscriber: () => sdk.ConversationTranscriber = (): sdk.ConversationTranscriber => {

    const f: File = WaveFileAudioInput.LoadFile(Settings.DependentVerificationWaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const t: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(config);
    expect(t).not.toBeUndefined();

    return t;
};

const GetParticipantKatie: () => sdk.IParticipant = (): sdk.IParticipant => {
    const voiceSignatureKatie: string = `{
              Version: 0,
              Tag: "VtZQ7sJp8np3AxQC+87WYyBHWsZohWFBN0zgWzzOnpw=",
              DDD: "EEE",
              Data: "BhRRgDCrg6ij5fylg5Jpf5ZW/o/uDWi199DYBbfL1Qdspj77qiuvsVKzG2g5Z9jxKtfdwtkKtaDxog9O6pGD7Ot/8mM1jUtt6LKNz4H9EFvznV/dlFk2Oisg8ZKx/RBlNFMYJkQJnxT/zLfhNWiIF5Y97jH4sgRh2orDg6/567FGktAgcESAbiDx1e7tf0TTLdwijw4p1vJ3qJ2cSCdNbXE9KeUd8sClQLDheCPo+et3rMs5W+Rju3W1SJE6ru9gAoH88CyAfI80+ysAecH3GPJYM+j1uhvmWoKIrSfS40BYOe6AUgLNb3a4Pue4oGAmuAyWfwpP1uezleSanpJc73HT91n2UsaHrQj5eK6uuBCjwmu+JI3FT+Vo6JhAARHecdb70U1wyW9vv5t0Q3tV1WNiN/30qSVydDtyrSVpgBiIwlj41Ua22JJCOMrPl7NKLnFmeZ4Hi4aIKoHAxDvrApteL60sxLX/ADAtYCB3Y6iagDyR1IOsIlbaPhL0rQDnC/0z65k7BDekietFNzvvPVoIwJ26GHrXFYYwZe3alVvCsXTpZGBknvSiaCalrixnyGqYo0nG/cd/LodEEIht/PWoFkNlbABqHMbToeI/6j+ICKuVJgTDtcsDQiWKSvrQp9kTSv+cF3LyPVkbks0JvbQhj4AkAv7Rvymgnsu6o8gGyxTX0kxujqCMPCzgFrVd"
             }`;
    // creates a participant
    const katie: sdk.IParticipant = sdk.Participant.From("katie@example.com", "en-us", voiceSignatureKatie);
    expect(katie).not.toBeUndefined();
    return katie;
};

const GetParticipantSteve: () => sdk.IParticipant = (): sdk.IParticipant => {
    const voiceSignatureSteve: string = `{
              Version: 0,
              Tag: "HbIvzbfAWjeR/3R+WvUEoeid1AbDaHNOMWItgs7mTxc=",
              DDD: "EEE",
              Data: "DizY04Z7PH/sYu2Yw2EcL4Mvj1GnEDOWJ/DhXHGdQJsQ8/zDc13z1cwllbEo5OSr3oGoKEHLV95OUA6PgksZzvTkf42iOFEv3yifUNfYkZuIzStZoDxWu1H1BoFBejqzSpCYyvqLwilWOyUeMn+z+E4+zXjqHUCyYJ/xf0C3+58kCbmyA55yj7YZ6OtMVyFmfT2GLiXr4YshUB14dgwl3Y08SRNavnG+/QOs+ixf3UoZ6BC1VZcVQnC2tn2FB+8v6ehnIOTQedo++6RWIB0RYmQ8VaEeI0E4hkpA1OxQ9f2gBVtw3KZXWSWBz8sXig2igpwMsQoFRmmIOGsu+p6tM8/OThQpARZ7OyAxsurzmaSGZAaXYt0YwMdIIXKeDBF6/KnUyw+NNzku1875u2Fde/bxgVvCOwhrLPPuu/RZUeAkwVQge7nKYNW5YjDcz8mfg4LfqWEGOVCcmf2IitQtcIEjY3MwLVNvsAB6GT2es1/1QieCfQKy/Tdu8IUfEvekwSCxSlWhfVrLjRhGeWa9idCjsngQbNkqYUNdnIlidkn2DC4BavSTYXR5lVxV4SR/Vvj8h4N5nP/URPDhkzl7n7Tqd4CGFZDzZzAr7yRo3PeUBX0CmdrKLW3+GIXAdvpFAx592pB0ySCv5qBFhJNErEINawfGcmeWZSORxJg1u+agj51zfTdrHZeugFcMs6Be"
             }`;
    // creates another participant
    const steve: sdk.IParticipant = sdk.Participant.From("steve@example.com", "en-us", voiceSignatureSteve);
    expect(steve).not.toBeUndefined();
    return steve;
};

test("CreateConversation", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: CreateConversation");
    const c: sdk.Conversation = CreateConversation();
    objsToClose.push(c);
    expect(c.properties).not.toBeUndefined();
});

test("BuildTranscriber", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: BuildTranscriber");
    const t: sdk.ConversationTranscriber = BuildTranscriber();
    objsToClose.push(t);

    expect(t.properties).not.toBeUndefined();
});

test("Create Conversation and join to Transcriber", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create Conversation and join to Transcriber");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.joinConversationAsync(c,
        () => {
            expect(t.properties).not.toBeUndefined();
            done();
        },
        (error: string) => {
            done.fail(error);
        });
});

test("Create Conversation and add participants", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create Conversation and join to Transcriber");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.sessionStopped = (o: sdk.ConversationTranscriber, e: sdk.SessionEventArgs) => {
        try {
            done();
        } catch (error) {
            done.fail(error);
        }
    };
    t.joinConversationAsync(c,
        () => {
            expect(t.properties).not.toBeUndefined();
            c.addParticipantAsync(GetParticipantKatie(),
                () => {
                    expect(c.participants).not.toBeUndefined();
                    expect(c.participants.length).toEqual(1);
                    // Adds steve as a participant to the conversation.
                    c.addParticipantAsync(GetParticipantSteve(),
                        () => {
                            expect(c.participants).not.toBeUndefined();
                            expect(c.participants.length).toEqual(2);
                            t.canceled = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs) => {
                                try {
                                    expect(e.errorDetails).toBeUndefined();
                                    expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
                                } catch (error) {
                                    done.fail(error);
                                }
                            };

                            t.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
                                try {
                                    expect(e).not.toBeUndefined();
                                    expect(e.result).not.toBeUndefined();
                                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                                    expect(e.result.text).not.toBeUndefined();
                                    expect(e.result.speakerId).not.toBeUndefined();
                                } catch (error) {
                                    done.fail(error);
                                }
                            };

                            /* tslint:disable:no-empty */
                            t.startTranscribingAsync(
                                /* tslint:disable:no-empty */
                                () => {},
                                (err: string) => {
                                    done.fail(err);
                                });
                        });
                });
        },
        (error: string) => {
            done.fail(error);
        });
}, 40000);

test("Leave Conversation", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Leave Conversation");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.joinConversationAsync(c,
        () => {
            expect(t.properties).not.toBeUndefined();
            c.addParticipantAsync(GetParticipantKatie(),
                () => {
                    expect(c.participants).not.toBeUndefined();
                    expect(c.participants.length).toEqual(1);
                    // Adds steve as a participant to the conversation.
                    c.addParticipantAsync(GetParticipantSteve(),
                        () => {
                            expect(c.participants).not.toBeUndefined();
                            expect(c.participants.length).toEqual(2);
                            t.canceled = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs) => {
                                done.fail(e.errorDetails);
                            };

                            t.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
                                done.fail(e.result.text);
                            };

                            t.transcribing = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
                                done.fail(e.result.text);
                            };

                            // Start transcribing, then leave conversation immediately. Expected to detach all text result listeners.
                            /* tslint:disable:no-empty */
                            t.startTranscribingAsync(
                                () => {
                                    t.leaveConversationAsync(
                                        () => {
                                            // Give potential transcription events a chance to be called back
                                            sleep(10000).catch();
                                            t.stopTranscribingAsync(
                                                () => {
                                                    done();
                                                },
                                                (err: string) => {
                                                    done.fail(err);
                                                });
                                        },
                                        (err: string) => {
                                            done.fail(err);
                                        });
                                },
                                (err: string) => {
                                    done.fail(err);
                                });
                        });
                });
        },
        (error: string) => {
            done.fail(error);
        });
});
test("Create Conversation with one channel audio (aligned)", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create Conversation with one channel audio (aligned)");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);
    let sessionId: string = "";

    const t: sdk.ConversationTranscriber = BuildMonoWaveTranscriber();
    t.canceled = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs) => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done.fail(error);
        }
    };
    t.sessionStopped = (o: sdk.ConversationTranscriber, e: sdk.SessionEventArgs) => {
        try {
            expect(e.sessionId).not.toBeUndefined();
            expect(e.sessionId).toEqual(sessionId);
            done();
        } catch (error) {
            done.fail(error);
        }
    };

    // let stopped: boolean = false;
    t.joinConversationAsync(c,
        () => {
            expect(t.properties).not.toBeUndefined();
            c.addParticipantAsync(GetParticipantKatie(),
                () => {
                    t.sessionStarted = (o: sdk.ConversationTranscriber, e: sdk.SessionEventArgs) => {
                        expect(e.sessionId).not.toBeUndefined();
                        sessionId = e.sessionId;
                    };

                    t.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
                        expect(e.result).not.toBeUndefined();
                        expect(e.result.text).not.toBeUndefined();
                        expect(e.result.text).toEqual("");
                    };

                    t.transcribing = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
                        done.fail(e.result.errorDetails);
                    };

                    /* tslint:disable:no-empty */
                    t.startTranscribingAsync(
                    /* tslint:disable:no-empty */
                        () => {},
                        (err: string) => {
                            done.fail(err);
                        });
                },
                (error: string) => {
                    done.fail(error);
                });
        },
        (error: string) => {
            done.fail(error);
        });
});
