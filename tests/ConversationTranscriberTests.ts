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
import { closeAsyncObjects } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

function sleep(milliseconds: number): Promise<any> {
    return new Promise((resolve: any) => setTimeout(resolve, milliseconds));
}

beforeAll((): void => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

beforeEach((): void => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // eslint-disable-next-line no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

const CreateConversation: (speechConfig?: sdk.SpeechConfig) => sdk.Conversation = (speechConfig?: sdk.SpeechConfig): sdk.Conversation => {
    let s: sdk.SpeechConfig = speechConfig;
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

const BuildSpeechConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeakerIDSubscriptionKey, Settings.SpeakerIDRegion);
    expect(s).not.toBeUndefined();
    return s;
};

const BuildTranscriber: () => sdk.ConversationTranscriber = (): sdk.ConversationTranscriber => {

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile8ch);
    objsToClose.push(config);

    const t: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(config);
    expect(t).not.toBeUndefined();
    objsToClose.push(t);

    return t;
};

const BuildMonoWaveTranscriber: () => sdk.ConversationTranscriber = (): sdk.ConversationTranscriber => {

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.DependentVerificationWaveFile);
    objsToClose.push(config);

    const t: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(config);
    expect(t).not.toBeUndefined();
    objsToClose.push(t);

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
    // eslint-disable-next-line no-console
    console.info("Name: CreateConversation");
    const c: sdk.Conversation = CreateConversation();
    objsToClose.push(c);
    expect(c.properties).not.toBeUndefined();
});

test("BuildTranscriber", () => {
    // eslint-disable-next-line no-console
    console.info("Name: BuildTranscriber");
    const t: sdk.ConversationTranscriber = BuildTranscriber();

    expect(t.properties).not.toBeUndefined();
});

test("Create Conversation and join to Transcriber", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Conversation and join to Transcriber");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.joinConversationAsync(c,
        () => {
            try {
                expect(t.properties).not.toBeUndefined();
                done();
            } catch (error) {
                done(error);
            }
        },
        (error: string) => {
            done(error);
        });
});

test("Create Conversation and add participants", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Conversation and join to Transcriber");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.sessionStopped = (o: sdk.ConversationTranscriber, e: sdk.SessionEventArgs) => {
        try {
            done();
        } catch (error) {
            done(error);
        }
    };
    t.canceled = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs) => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
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
            done(error);
        }
    };

    t.joinConversationAsync(c,
        () => {
            try {
                expect(t.properties).not.toBeUndefined();
                c.addParticipantAsync(GetParticipantKatie(),
                    () => {
                        try {
                            expect(c.participants).not.toBeUndefined();
                            expect(c.participants.length).toEqual(1);
                            // Adds steve as a participant to the conversation.
                            c.addParticipantAsync(GetParticipantSteve(),
                                () => {
                                    try {
                                        expect(c.participants).not.toBeUndefined();
                                        expect(c.participants.length).toEqual(2);
                                    } catch (error) {
                                        done(error);
                                    }

                                    /* eslint-disable:no-empty */
                                    t.startTranscribingAsync(
                                        /* eslint-disable:no-empty */
                                        () => {},
                                        (err: string) => {
                                            done(err);
                                        });
                                });
                        } catch (error) {
                            done(error);
                        }
                    });
            } catch (error) {
                done(error);
            }
        },
        (error: string) => {
            done(error);
        });
}, 50000);

test("Leave Conversation", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Leave Conversation");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.canceled = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs) => {
        done(e.errorDetails);
    };

    t.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        done(e.result.text);
    };

    t.transcribing = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        done(e.result.text);
    };

    t.joinConversationAsync(c,
        (): void => {
            try {
                expect(t.properties).not.toBeUndefined();
                c.addParticipantAsync(GetParticipantKatie(),
                    (): void => {
                        try {
                            expect(c.participants).not.toBeUndefined();
                            expect(c.participants.length).toEqual(1);
                            // Adds steve as a participant to the conversation.
                            c.addParticipantAsync(GetParticipantSteve(),
                                (): void => {
                                    try {
                                        expect(c.participants).not.toBeUndefined();
                                        expect(c.participants.length).toEqual(2);
                                        // Start transcribing, then leave conversation immediately. Expected to detach all text result listeners.
                                        /* eslint-disable:no-empty */
                                        t.startTranscribingAsync(
                                            (): void => {
                                                t.leaveConversationAsync(
                                                    (): void => {
                                                        // Give potential transcription events a chance to be called back
                                                        void sleep(10000).catch();
                                                        t.stopTranscribingAsync(
                                                            (): void => {
                                                                done();
                                                            },
                                                            (err: string): void => {
                                                                done(err);
                                                            });
                                                    },
                                                    (err: string): void => {
                                                        done(err);
                                                });
                                            },
                                            (err: string): void => {
                                                done(err);
                                            });
                                    } catch (error) {
                                        done(error as string);
                                    }
                            });
                        } catch (error) {
                            done(error as string);
                        }
                });
            } catch (error) {
                done(error as string);
            }
        },
        (error: string): void => {
            done(error);
        });
});

test("Create Conversation with one channel throws", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Conversation with one channel audio (aligned)");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildMonoWaveTranscriber();

    t.joinConversationAsync(c,
        (): void => {
            done.fail("No successful callback expected for single channel CTS");
        },
        (error: string): void => {
            expect(error).toEqual("Error: Single channel audio configuration for ConversationTranscriber is currently under private preview, please contact diarizationrequest@microsoft.com for more details");
            done();
        });
});

test.skip("Create Conversation with one channel audio (aligned)", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Conversation with one channel audio (aligned)");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);
    let sessionId: string = "";
    let canceled: boolean = false;

    const t: sdk.ConversationTranscriber = BuildMonoWaveTranscriber();
    t.canceled = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs) => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
            canceled = true;
        } catch (error) {
            done(error);
        }
    };
    t.sessionStopped = (o: sdk.ConversationTranscriber, e: sdk.SessionEventArgs) => {
        try {
            expect(canceled).toEqual(true);
            expect(e.sessionId).not.toBeUndefined();
            expect(e.sessionId).toEqual(sessionId);
            done();
        } catch (error) {
            done(error);
        }
    };
    t.sessionStarted = (o: sdk.ConversationTranscriber, e: sdk.SessionEventArgs) => {
        try {
            expect(e.sessionId).not.toBeUndefined();
            sessionId = e.sessionId;
        } catch (error) {
            done(error);
        }
    };

    t.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            expect(e.result).not.toBeUndefined();
            expect(e.result.text).not.toBeUndefined();
            expect(e.result.text).toEqual("");
        } catch (error) {
            done(error);
        }
    };

    t.transcribing = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        done(e.result.errorDetails);
    };

    t.joinConversationAsync(c,
        () => {
            try {
                expect(t.properties).not.toBeUndefined();
                c.addParticipantAsync(GetParticipantKatie(),
                    () => {
                        /* eslint-disable:no-empty */
                        t.startTranscribingAsync(
                            /* eslint-disable:no-empty */
                            () => { },
                            (err: string) => {
                                done(err);
                            });
                    },
                    (error: string) => {
                        done(error);
                    });
            } catch (error) {
                done(error);
            }
        },
        (error: string) => {
            done(error);
        });
});

test("Create Conversation and create PhraseListGrammar", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Conversation and create PhraseListGrammar");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.joinConversationAsync(c,
        (): void => {
            try {
                const phraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(t);
                expect(phraseListGrammar).not.toBeUndefined();
                done();
            } catch (error) {
                done(error);
            }
        },
        (error: string): void => {
            done(error);
        });
});

test("Create Conversation and force disconnect", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Conversation and force disconnect");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    // Use 12s timeout since backend timeout is 10s.
    s.setServiceProperty("maxConnectionDurationSecs", "12", sdk.ServicePropertyChannel.UriQueryParameter);
    objsToClose.push(s);

    const c: sdk.Conversation = CreateConversation(s);
    objsToClose.push(c);

    const t: sdk.ConversationTranscriber = BuildTranscriber();
    t.canceled = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs) => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
            done();
        } catch (error) {
            done(error);
        }
    };

    t.joinConversationAsync(c,
        (): void => {
            try {
                expect(t.properties).not.toBeUndefined();
                c.addParticipantAsync(GetParticipantKatie(),
                    (): void => {
                        try {
                            expect(c.participants).not.toBeUndefined();
                            expect(c.participants.length).toEqual(1);
                            // Adds steve as a participant to the conversation.
                            c.addParticipantAsync(GetParticipantSteve(),
                                (): void => {
                                    try {
                                        expect(c.participants).not.toBeUndefined();
                                        expect(c.participants.length).toEqual(2);
                                    } catch (error) {
                                        done(error as string);
                                    }

                                    t.startTranscribingAsync(
                                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                                        (): void => {},
                                        (err: string): void => {
                                            done(err);
                                        });
                                });
                        } catch (error) {
                            done(error as string);
                        }
                    });
            } catch (error) {
                done(error);
            }
        },
        (error: string) => {
            done(error);
        });
}, 64000);
