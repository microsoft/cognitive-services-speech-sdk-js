// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import {
    Events,
    EventType,
    Timeout
} from "../src/common/Exports";

import { Settings } from "./Settings";
import { closeAsyncObjects } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


let objsToClose: any[];

const sleep = (milliseconds: number): Promise<any> => new Promise((resolve: any): Timeout => setTimeout(resolve, milliseconds));

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

const CreateMeeting: (speechConfig?: sdk.SpeechTranslationConfig) => sdk.Meeting = (speechConfig?: sdk.SpeechTranslationConfig): sdk.Meeting => {
    let s: sdk.SpeechTranslationConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const randomId = Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    const m: sdk.Meeting = sdk.Meeting.createMeetingAsync(s, randomId);
    expect(m).not.toBeUndefined();

    return m;
};

const BuildSpeechConfig: () => sdk.SpeechTranslationConfig = (): sdk.SpeechTranslationConfig => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    return s;
};

const BuildMeetingTranscriber: () => sdk.MeetingTranscriber = (): sdk.MeetingTranscriber => {

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile8ch2);
    objsToClose.push(config);

    const t: sdk.MeetingTranscriber = new sdk.MeetingTranscriber(config);
    expect(t).not.toBeUndefined();
    objsToClose.push(t);

    return t;
};

const BuildMonoWaveTranscriber: () => sdk.MeetingTranscriber = (): sdk.MeetingTranscriber => {

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.DependentVerificationWaveFile);
    objsToClose.push(config);

    const m: sdk.MeetingTranscriber = new sdk.MeetingTranscriber(config);
    expect(m).not.toBeUndefined();
    objsToClose.push(m);

    return m;
};

const GetParticipantKatie: () => sdk.IParticipant = (): sdk.IParticipant => {
    const voiceSignatureKatie: string = `{
              Version: 0,
              Tag: "pbTOR8WdtFtyg8XU7pXSuBQTJIKKjeQ7TqysJ6nDST0=",
              DDD: "EEE",
              Data: "lYK0q5n60l7jf0FYJYzIDGxPHayVBoCO3miTLUPTP1+Nc/LEktB4giLXeY0akDM/Y9BbYcYWkbmaZQNCwzVQLHWSrBFP1M3EDKyZ5kTgle++cnm8oTd3Icu18zvj01JZa51Ti2GsIEqjaMfbL9fAvw5Iv4xCltgOhn5SLWybQ7B3kHhFhnRXXTR8XFY+pvWkBNzXVXzTgsx7NsEYjLVihvA6d/dr1HjuTT21O51uR9djpR0ygWYEamuz+MFyQv1uvQG257VlGwB8CDEoDrDepZSMJe67G07DQHdsys6noYpE4lejQuG+IbvWIxTgAYQ+F/uX4Pl1TydmXidkFOac+E5sh/EfedbunoN7JLUQv9PZhYnAPY4TLKNjFg+zRMoUvG7aSateE1G5PqT27bsZ0GxoLuNyDjetOtysjZ/txtPDxEccp0B2BalYi4PNQN1DGW6FntyaNxcGNyPBClWd/lLK/1HDf8GpmdoHWvAgsG9ZGGBSrb/UyKWdakZLOJMA8AqRhtgeKovsA+1KIrArCqnGMJL8TF7kVqfdeHguVi3mO3+7ru4p/xmJpHWqWz1J3Rb0Vc6sINrMNJmhisQ45xEGi0pl7Mu1ttTJsAm7avkP6H29rQ4FpFvgEibCFrzJCeTgmHy8ULQ7cSZ/ohpzGMgCBMjdhPRgq2IQZUmvJEO8egMTCTSCBLEQqQf/Gxhg"
             }`;
    // creates a participant
    const katie: sdk.IParticipant = sdk.Participant.From("katie@example.com", "en-us", voiceSignatureKatie);
    expect(katie).not.toBeUndefined();
    return katie;
};

const GetParticipantSteve: () => sdk.IParticipant = (): sdk.IParticipant => {
    const voiceSignatureSteve: string = `{
              Version: 0,
              Tag: "Lztl/2j3C1YlFM8y6au8aRBSWtkMXKUB99Ky1YL3Smo=",
              DDD: "EEE",
              Data: "IMaZN7iL42XzgLH2tAkWbT7XJDtrEi6+BNJvAK70nODqbCBID1tPFuI6HirqYp6LQrvzphH45eHXYDsnLf00fpDMSjGEhso2o/P9ut4AYE60jrr56JqXwpSahtycpvsgXNpcqiXTfyfA/6dW64UJec42hWGWqbSuNTsskCMlDxPH+FPLpMeETTklRM/LS4qlTezZC6Q1si6yzRZ0B2kLNGymfkkIv/rUoCnrFiaLPVRuf7ybLsvY8UaVBFWTgPSTkRbJSmPvg9nLWvdraekjGH0ltXBRz5k11vm4JZijGQ7GezNcEH8V0fqIT4FcBmiXIXp9DaLGtXgLLPZ7WBZ4t478sHivb2QEhIBE1znpI7ENEVIJVSQone0w20kny77fO07r4q7XC4zIKKzLnz4LrswiAiyZFYlU6xg8XuLDTn7dvMwgrV5cev84qo6xSPJKIQveHceaIFeGw/KnOeOKcQHE9eZpCCmypRNkmabCXDGFIFCW1yGNw5t8oM3SomhSAcieXDK05uJU3tbSGCOqED5VDaaO0kP1xa7Lb8WyALklmz84rw7Z+hQHiCucT1FHEnILQGFjYVaifycNaiNDfolVS60/N+TLVgfMyRJdBn0NUn7+h9MjrtC8Mkjttii6Q/P42/WUhfsqJlOJkJt1Edny6k6+9V2j3b7a6FO49SKr8FEydlwmJlnpKbaYv5ks"
             }`;
    // creates another participant
    const steve: sdk.IParticipant = sdk.Participant.From("steve@example.com", "en-us", voiceSignatureSteve);
    expect(steve).not.toBeUndefined();
    return steve;
};

test("CreateMeeting", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: CreateMeeting");
    const m: sdk.Meeting = CreateMeeting();
    objsToClose.push(m);
    expect(m.properties).not.toBeUndefined();
});

test("NullMeetingId", (): void => {
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    // Since we're not going to return it, mark it for closure.
    objsToClose.push(s);
    expect((): sdk.Meeting => sdk.Meeting.createMeetingAsync(s, null)).toThrow();
});

test("EmptyMeetingId", (): void => {
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    // Since we're not going to return it, mark it for closure.
    objsToClose.push(s);
    expect((): sdk.Meeting => sdk.Meeting.createMeetingAsync(s, "")).toThrow();
});

test("CreateMeetingTranscriber", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: CreateMeetingTranscriber");
    const t: sdk.MeetingTranscriber = BuildMeetingTranscriber();

    expect(t.properties).not.toBeUndefined();
});

test("Create Meeting and join to Transcriber", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Meeting and join to Transcriber");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const m: sdk.Meeting = CreateMeeting(s);
    objsToClose.push(m);

    const t: sdk.MeetingTranscriber = BuildMeetingTranscriber();
    t.joinMeetingAsync(m,
        (): void => {
            try {
                expect(t.properties).not.toBeUndefined();
                done();
            } catch (error) {
                done(error);
            }
        },
        (error: string): void => {
            done(error);
        });
});

test("Create Meeting and add participants", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Meeting and add participants");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const m: sdk.Meeting = CreateMeeting(s);
    objsToClose.push(m);

    const t: sdk.MeetingTranscriber = BuildMeetingTranscriber();
    t.sessionStopped = (o: sdk.MeetingTranscriber, e: sdk.SessionEventArgs): void => {
        try {
            done();
        } catch (error) {
            done(error);
        }
    };
    t.canceled = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    t.transcribed = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionEventArgs): void => {
        try {
            expect(e).not.toBeUndefined();
            expect(e.result).not.toBeUndefined();
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.text).not.toBeUndefined();
            expect(e.result.speakerId).not.toBeUndefined();
            // eslint-disable-next-line no-console
            console.info("[Transcribed] *** SpeakerId: " + e.result.speakerId + " Text:" + e.result.text);
        } catch (error) {
            done(error);
        }
    };

    t.joinMeetingAsync(m,
        (): void => {
            try {
                expect(t.properties).not.toBeUndefined();
                m.addParticipantAsync(GetParticipantKatie(),
                    (): void => {
                        try {
                            expect(m.participants).not.toBeUndefined();
                            expect(m.participants.length).toEqual(1);
                            // Adds steve as a participant to the conversation.
                            m.addParticipantAsync(GetParticipantSteve(),
                                (): void => {
                                    try {
                                        expect(m.participants).not.toBeUndefined();
                                        expect(m.participants.length).toEqual(2);
                                    } catch (error) {
                                        done(error);
                                    }

                                    /* eslint-disable:no-empty */
                                    t.startTranscribingAsync(
                                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                                        (): void => { },
                                        (err: string): void => {
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
        (error: string): void => {
            done(error);
        });
}, 50000);

test("Leave Meeting", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Leave Meeting");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const m: sdk.Meeting = CreateMeeting(s);
    objsToClose.push(m);

    const t: sdk.MeetingTranscriber = BuildMeetingTranscriber();
    t.canceled = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionCanceledEventArgs): void => {
        done(e.errorDetails);
    };

    t.transcribed = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionEventArgs): void => {
        done(e.result.text);
    };

    t.transcribing = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionEventArgs): void => {
        done(e.result.text);
    };

    t.joinMeetingAsync(m,
        (): void => {
            try {
                expect(t.properties).not.toBeUndefined();
                m.addParticipantAsync(GetParticipantKatie(),
                    (): void => {
                        try {
                            expect(m.participants).not.toBeUndefined();
                            expect(m.participants.length).toEqual(1);
                            // Adds steve as a participant to the conversation.
                            m.addParticipantAsync(GetParticipantSteve(),
                                (): void => {
                                    try {
                                        expect(m.participants).not.toBeUndefined();
                                        expect(m.participants.length).toEqual(2);
                                        // Start transcribing, then leave meeting immediately. Expected to detach all text result listeners.
                                        /* eslint-disable:no-empty */
                                        t.startTranscribingAsync(
                                            (): void => {
                                                t.leaveMeetingAsync(
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

test("Create Meeting with one channel throws", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Meeting with one channel audio (aligned)");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const m: sdk.Meeting = CreateMeeting(s);
    objsToClose.push(m);

    const t: sdk.MeetingTranscriber = BuildMonoWaveTranscriber();

    t.joinMeetingAsync(m,
        (): void => {
            done.fail("No successful callback expected for single channel CTS");
        },
        (error: string): void => {
            expect(error).toEqual("Error: Single channel audio configuration for MeetingTranscriber is currently under private preview, please contact diarizationrequest@microsoft.com for more details");
            done();
        });
});

test.skip("Create Conversation with one channel audio (aligned)", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Conversation with one channel audio (aligned)");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const m: sdk.Meeting = CreateMeeting(s);
    objsToClose.push(m);
    let sessionId: string = "";
    let canceled: boolean = false;

    const t: sdk.MeetingTranscriber = BuildMonoWaveTranscriber();
    t.canceled = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
            canceled = true;
        } catch (error) {
            done(error);
        }
    };
    t.sessionStopped = (o: sdk.MeetingTranscriber, e: sdk.SessionEventArgs): void => {
        try {
            expect(canceled).toEqual(true);
            expect(e.sessionId).not.toBeUndefined();
            expect(e.sessionId).toEqual(sessionId);
            done();
        } catch (error) {
            done(error);
        }
    };
    t.sessionStarted = (o: sdk.MeetingTranscriber, e: sdk.SessionEventArgs): void => {
        try {
            expect(e.sessionId).not.toBeUndefined();
            sessionId = e.sessionId;
        } catch (error) {
            done(error);
        }
    };

    t.transcribed = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionEventArgs): void => {
        try {
            expect(e.result).not.toBeUndefined();
            expect(e.result.text).not.toBeUndefined();
            expect(e.result.text).toEqual("");
        } catch (error) {
            done(error);
        }
    };

    t.transcribing = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionEventArgs): void => {
        done(e.result.errorDetails);
    };

    t.joinMeetingAsync(m,
        (): void => {
            try {
                expect(t.properties).not.toBeUndefined();
                m.addParticipantAsync(GetParticipantKatie(),
                    (): void => {
                        /* eslint-disable:no-empty */
                        t.startTranscribingAsync(
                            /* eslint-disable:no-empty */
                            (): void => { },
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

test("Create Meeting and create PhraseListGrammar", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Meeting and create PhraseListGrammar");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const m: sdk.Meeting = CreateMeeting(s);
    objsToClose.push(m);

    const t: sdk.MeetingTranscriber = BuildMeetingTranscriber();
    t.joinMeetingAsync(m,
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

test("Create Meeting and force disconnect", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create Meeting and force disconnect");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    // Use 12s timeout since backend timeout is 10s.
    s.setServiceProperty("maxConnectionDurationSecs", "12", sdk.ServicePropertyChannel.UriQueryParameter);
    objsToClose.push(s);

    const m: sdk.Meeting = CreateMeeting(s);
    objsToClose.push(m);

    const t: sdk.MeetingTranscriber = BuildMeetingTranscriber();
    t.canceled = (o: sdk.MeetingTranscriber, e: sdk.MeetingTranscriptionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
            done();
        } catch (error) {
            done(error);
        }
    };

    t.joinMeetingAsync(m,
        (): void => {
            try {
                expect(t.properties).not.toBeUndefined();
                m.addParticipantAsync(GetParticipantKatie(),
                    (): void => {
                        try {
                            expect(m.participants).not.toBeUndefined();
                            expect(m.participants.length).toEqual(1);
                            // Adds steve as a participant to the conversation.
                            m.addParticipantAsync(GetParticipantSteve(),
                                (): void => {
                                    try {
                                        expect(m.participants).not.toBeUndefined();
                                        expect(m.participants.length).toEqual(2);
                                    } catch (error) {
                                        done(error as string);
                                    }

                                    t.startTranscribingAsync(
                                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                                        (): void => { },
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
