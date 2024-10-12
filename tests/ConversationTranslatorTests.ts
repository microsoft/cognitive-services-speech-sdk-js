// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// TODO
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener
} from "../src/common.browser/Exports";
import {
    ServicePropertiesPropertyName
} from "../src/common.speech/Exports";
import {
    ConnectionStartEvent,
    Events,
    IStringDictionary,
    IDetachable,
    PlatformEvent,
} from "../src/common/Exports";
import { Settings } from "./Settings";
import {
    closeAsyncObjects,
    WaitForCondition
} from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


// eslint-disable-next-line no-console
const consoleInfo = console.info;

const endpointHost: string = Settings.ConversationTranslatorHost;
const speechEndpointHost: string = Settings.ConversationTranslatorSpeechHost;

// eslint-disable-next-line no-console
console.info = (...args: any[]): void => {

    const formatConsoleDate = (): string => {
        const date = new Date();
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const milliseconds = date.getMilliseconds();

        return "[" +
            ((hour < 10) ? "0" + hour : hour) +
            ":" +
            ((minutes < 10) ? "0" + minutes : minutes) +
            ":" +
            ((seconds < 10) ? "0" + seconds : seconds) +
            "." +
            ("00" + milliseconds).slice(-3) +
            "] ";
    };
    const timestamp = formatConsoleDate(); //  `[${new Date().toTimeString()}]`;
    consoleInfo.apply(this, [timestamp, args]);
};

let objsToClose: any[];

beforeAll((): void => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(sdk.LogLevel.Debug));
});

beforeEach((): void => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
});

jest.retryTimes(Settings.RetryCount);
jest.setTimeout(90 * 1000);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});


// Conversation tests: begin
describe("conversation constructor tests", (): void => {

    test("Create Conversation, null constructor", (): void => {
        expect((): sdk.Conversation => sdk.Conversation.createConversationAsync(null)).toThrowError();
    });

    test("Create Conversation, undefined constructor", (): void => {
        expect((): sdk.Conversation => sdk.Conversation.createConversationAsync(undefined)).toThrowError();
    });
});

describe("conversation config tests", (): void => {

    test("Create Conversation, config with lang", (): void => {

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");
        config.speechRecognitionLanguage = "fr-FR";
        config.addTargetLanguage("de-DE");

        const c: sdk.Conversation = sdk.Conversation.createConversationAsync(config);
        objsToClose.push(c);
        expect(c.speechRecognitionLanguage).not.toBeUndefined();
        expect(c.speechRecognitionLanguage).not.toBeNull();
        expect(c.speechRecognitionLanguage).toEqual("fr-FR");
        expect(c.config.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage])).toEqual("fr-FR");
        expect(c.properties.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage])).toEqual("fr-FR");
        expect(c.config.targetLanguages.length).toEqual(1);
    });

    test("Create Conversation, config with no lang", (): void => {

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");

        const c: sdk.Conversation = sdk.Conversation.createConversationAsync(config);
        objsToClose.push(c);
        expect(c.speechRecognitionLanguage).not.toBeUndefined();
        expect(c.speechRecognitionLanguage).not.toBeNull();
        expect(c.speechRecognitionLanguage).toEqual("en-US");
        expect(c.config.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage])).toEqual("en-US");
        expect(c.properties.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage])).toEqual("en-US");
        expect(c.config.targetLanguages.length).toEqual(1);
    });

    test("Create Conversation, config with endpoint", () => {

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c = sdk.Conversation.createConversationAsync(config);
        objsToClose.push(c);

        expect(c.properties).not.toBeUndefined();
        expect(c.config).not.toBeUndefined();
        expect(c.properties.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host])).toEqual(config.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host]));
        expect(c.config.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host])).toEqual(config.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host]));
        expect(c.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_Host)).toEqual(config.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host]));
        expect(c.config.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host])).toEqual(config.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host]));
    });

    test("Create Conversation, config with nickname", () => {

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");
        config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name], "Tester");

        const c = sdk.Conversation.createConversationAsync(config);
        objsToClose.push(c);
        expect(c.properties).not.toBeUndefined();
        expect(c.config).not.toBeUndefined();
        expect(c.properties.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name])).toEqual(config.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name]));
        expect(c.config.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name])).toEqual(config.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name]));
    });

    test("Create Conversation, config with no nickname", () => {

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");
        const c = sdk.Conversation.createConversationAsync(config);
        objsToClose.push(c);
        expect(c.properties).not.toBeUndefined();
        expect(c.config).not.toBeUndefined();
        expect(c.properties.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name])).toEqual("Host");
        expect(c.config.getProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name])).toEqual("Host");
    });

    test("Create Conversation, set token property", (): void => {

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");
        const c = sdk.Conversation.createConversationAsync(config);
        objsToClose.push(c);
        expect(c.properties).not.toBeUndefined();
        expect(c.config).not.toBeUndefined();

        c.authorizationToken = "12345";
        expect(c.authorizationToken).toEqual("12345");
    });

    test("Create Conversation, set token null property", (): void => {

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");
        const c = sdk.Conversation.createConversationAsync(config);
        objsToClose.push(c);
        expect(c.properties).not.toBeUndefined();
        expect(c.config).not.toBeUndefined();

        expect(() => c.authorizationToken = "").toThrowError();
    });

});

describe("conversation service tests", (): void => {

    test("Start Conversation, valid params", (done: jest.DoneCallback) => {

        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        config.speechRecognitionLanguage = "en-US";
        config.addTargetLanguage("de-DE");
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c = sdk.Conversation.createConversationAsync(config, ((): void => {
            try {
                expect(c.conversationId.length).toEqual(5);
            } catch (e) {
                done(e);
            }
        }));

        objsToClose.push(c);

        WaitForCondition((): boolean => (c.conversationId !== "" && c.conversationId.length === 5), done);

    }, 80000);

    test("Start Conversation, invalid language [400003]", (done: jest.DoneCallback): void => {

        let errorMessage: string;
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        config.speechRecognitionLanguage = "abc";
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c = sdk.Conversation.createConversationAsync(config, undefined, ((error: any): void => {
            try {
                expect(error).toContain("400003");
            } catch (e) {
                done(e);
            }
            errorMessage = error as string;
        }));
        objsToClose.push(c);

        WaitForCondition((): boolean => (errorMessage !== undefined), done);

    }, 80000);

    test("Start Conversation, invalid nickname [400025]", (done: jest.DoneCallback): void => {

        let errorMessage: string;

        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        config.speechRecognitionLanguage = "en-US";
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }
        config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name], "Host.Testing");

        const c = sdk.Conversation.createConversationAsync(config, undefined, ((error: any): void => {
            try {
                expect(error).toContain("400025");
                errorMessage = error as string;
            } catch (e) {
                done(e);
            }
        }));
        objsToClose.push(c);

        WaitForCondition((): boolean => (errorMessage !== undefined), done);

    }, 80000);

    test("Start Conversation, invalid subscription key or region [401000]", (done: jest.DoneCallback): void => {

        let errorMessage: string;

        const config = sdk.SpeechTranslationConfig.fromSubscription("abc", "def");
        config.speechRecognitionLanguage = "en-US";
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c = sdk.Conversation.createConversationAsync(config, undefined, ((error: any): void => {
            try {
                expect(error).toContain("401000");
            } catch (e) {
                done(e);
            }
            errorMessage = error as string;
        }));
        objsToClose.push(c);

        WaitForCondition((): boolean => (errorMessage !== undefined), done);

    }, 80000);

    test("Start Conversation, join as host and mute participants", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Start Conversation, join as host, mute participants");

        let participantsCount: number = 0;
        const isMuted: boolean = true;

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c: sdk.Conversation = sdk.Conversation.createConversationAsync(config, ((): void => {
            const ct: sdk.ConversationTranslator = new sdk.ConversationTranslator();
            objsToClose.push(ct);
            if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
            if (speechEndpointHost !== "") { ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

            ct.canceled = ((s: sdk.ConversationTranslator, e: sdk.ConversationTranslationCanceledEventArgs): void => {
                if (e.errorCode !== sdk.CancellationErrorCode.NoError) {
                    done();
                } else {
                    ct.leaveConversationAsync((): void => {
                        c.endConversationAsync(
                            done,
                            (e: string): void => {
                                done(e);
                            });
                    },
                        (e: string): void => {
                            done(e);
                        });
                }
            });

            ct.participantsChanged = ((s: sdk.ConversationTranslator, e: sdk.ConversationParticipantsChangedEventArgs): void => {
                if (e.reason === sdk.ParticipantChangedReason.JoinedConversation) {
                    participantsCount++;
                    if (participantsCount === 1) {
                        joinParticipant(c.conversationId);
                    } else {
                        c.muteAllParticipantsAsync();
                    }
                } else if (e.reason === sdk.ParticipantChangedReason.Updated) {
                    if (e.participants.length > 0) {
                        // check if the updated participant list contains the joiner
                        const isParticipant: number = e.participants.findIndex((p: sdk.Participant): boolean => p.isHost === false);
                        if (isParticipant > -1) {
                            // only the participants should be updated by a mute all command
                            try {
                                expect(e.participants[0].isMuted).toEqual(isMuted);
                                ct.leaveConversationAsync((): void => {
                                    c.endConversationAsync(
                                        done,
                                        (e: string): void => {
                                            done(e);
                                        });
                                },
                                    (e: string): void => {
                                        done(e);
                                    });
                            } catch (e) {
                                done(e);
                            }
                        }
                    }
                }
            });

            c.startConversationAsync(() => {
                ct.joinConversationAsync(c, "Host",
                    (() => {
                        // continue
                    }),
                    ((error: any) => {
                        done();
                    }));
            });
        }),
            ((error: any) => {
                done();
            }));
        objsToClose.push(c);

        function joinParticipant(code: string): void {
            // join as a participant
            const ctP: sdk.ConversationTranslator = new sdk.ConversationTranslator();
            if (endpointHost !== "") { ctP.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
            if (speechEndpointHost !== "") { ctP.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }
            objsToClose.push(ctP);
            ctP.joinConversationAsync(code, "mute me", "en-US",
                (() => {
                    // continue
                }),
                ((error: any) => {
                    done();
                }));
        }

    }, 40000);

    test("Start Conversation, join as host and send message", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Start Conversation, join as host and send message");

        let textMessage: string = "";

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c: sdk.Conversation = sdk.Conversation.createConversationAsync(config, ((): void => {
            objsToClose.push(c);

            const ct: sdk.ConversationTranslator = new sdk.ConversationTranslator();
            objsToClose.push(ct);

            if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
            if (speechEndpointHost !== "") { ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

            ct.participantsChanged = ((s: sdk.ConversationTranslator, e: sdk.ConversationParticipantsChangedEventArgs): void => {
                sendMessage(`Hello ${e.participants[0].displayName}`);
            });
            ct.textMessageReceived = ((s: sdk.ConversationTranslator, e: sdk.ConversationTranslationEventArgs): void => {
                // eslint-disable-next-line  no-console
                console.log(`text message received: ${e.result.text}`);
                textMessage = e.result.text;
            });

            function sendMessage(message: string): void {
                ct.sendTextMessageAsync(message);
            }

            c.startConversationAsync(
                ((): void => {
                    ct.joinConversationAsync(c, "Host",
                        ((): void => {
                            // continue
                            // eslint-disable-next-line  no-console
                            console.log("joined");
                        }),
                        ((error: any): void => {
                            // eslint-disable-next-line  no-console
                            console.log("error joining: " + error);
                            done();
                        }));
                }),
                ((error: any): void => {
                    // eslint-disable-next-line  no-console
                    console.log("error starting: " + error);
                    done();
                }));
        }),
            ((error: any): void => {
                done();
            }));

        WaitForCondition((): boolean => (textMessage.includes("Hello")), done);

    }, 60000);

    test("Start Conversation, join as host and eject participant", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Start Conversation, join as host and eject participant");

        let participantsCount: number = 0;
        let participantId: string = "";
        let ejected: number = 0;

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c: sdk.Conversation = sdk.Conversation.createConversationAsync(config, ((): void => {
            objsToClose.push(c);

            const ct: sdk.ConversationTranslator = new sdk.ConversationTranslator();
            objsToClose.push(ct);

            if (endpointHost !== "") {
                ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost);
            }
            if (speechEndpointHost !== "") {
                ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost);
            }
            ct.canceled = ((s: sdk.ConversationTranslator, e: sdk.ConversationTranslationCanceledEventArgs): void => {
                if (e.errorCode !== sdk.CancellationErrorCode.NoError) {
                    done();
                } else {
                    ct.leaveConversationAsync(() => {
                        c.endConversationAsync(
                            done,
                            (e: string) => { done(e); });
                    },
                        (e: string) => { done(e); });
                }
            });
            ct.participantsChanged = ((s: sdk.ConversationTranslator, e: sdk.ConversationParticipantsChangedEventArgs): void => {
                if (e.reason === sdk.ParticipantChangedReason.JoinedConversation) {
                    participantsCount++;
                    if (participantsCount === 1) {
                        // the host has joined
                        joinParticipant(c.conversationId);
                    } else {
                        // a participant is joining
                        participantId = e.participants[0].id;
                        eject(participantId);
                    }
                } else if (e.reason === sdk.ParticipantChangedReason.LeftConversation) {
                    try {
                        expect(e.participants[0].id).toEqual(participantId);
                    } catch (e) {
                        done(e);
                    }
                    ct.leaveConversationAsync(() => {
                        c.endConversationAsync(() => {
                            ejected++;
                        },
                            (e: string) => { done(e); });
                    },
                        (e: string) => { done(e); });
                }
            });

            function eject(id: string): void {
                c.removeParticipantAsync(participantId, undefined, done.fail);
            }

            c.startConversationAsync((): void => {
                ct.joinConversationAsync(c, "Host",
                    ((): void => {
                        // continue
                    }),
                    ((error: any): void => {
                        done();
                    }));
            });
        }),
            ((error: any): void => {
                done();
            }));

        function joinParticipant(code: string): void {
            // join as a participant
            const ctP: sdk.ConversationTranslator = new sdk.ConversationTranslator();
            if (endpointHost !== "") { ctP.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
            if (speechEndpointHost !== "") { ctP.properties.setProperty(sdk.PropertyId.SpeechServiceConnection_Host, speechEndpointHost); }
            ctP.joinConversationAsync(code, "remove me", "en-US",
                (() => {
                    // continue
                }),
                ((error: any) => {
                    done();
                }));
        }

        WaitForCondition((): boolean => (ejected > 0), done);

    }, 60000);

    // Test is failing due to a service timeout.
    test.skip("Start Conversation, join as host and set service property", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Start Conversation, join as host and set service property");

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        const c: sdk.Conversation = sdk.Conversation.createConversationAsync(config, ((): void => {
            objsToClose.push(c);

            console.info("Conversation Created");

            // audio config
            const audioConfig: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
            objsToClose.push(audioConfig);

            const ct: sdk.ConversationTranslator = new sdk.ConversationTranslator(audioConfig);
            objsToClose.push(ct);

            if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
            if (speechEndpointHost !== "") { ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

            const propName: string = "foo";
            const propValue: string = "bar";

            ct.setServiceProperty(propName, propValue);

            console.info("Property set");
            const currentProperties: IStringDictionary<string> = JSON.parse(ct.properties.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;
            expect(currentProperties[propName]).toEqual(propValue);

            c.startConversationAsync((): void => {
                console.info("Conversation Started")
                // Check that uri for service connection contains service property and value
                const detachObject: IDetachable = Events.instance.attachListener({
                    onEvent: (event: PlatformEvent): void => {
                        if (event instanceof ConnectionStartEvent) {
                            console.info("Connection started")
                            const connectionEvent: ConnectionStartEvent = event as ConnectionStartEvent;
                            const uri: string = connectionEvent.uri;
                            expect(uri).not.toBeUndefined();
                            if (!uri.includes("capito")) {
                                console.info("Checking URL " + uri)
                                // Make sure there's only a single ? in the URL.
                                expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));
                                expect(uri).toContain(`${propName}=${propValue}`);
                                void detachObject.detach();
                            }
                        }
                    },
                });
                ct.participantsChanged = ((s: sdk.ConversationTranslator, e: sdk.ConversationParticipantsChangedEventArgs): void => {
                    try {
                        console.info("Starting transcription");
                        ct.startTranscribingAsync((): void => {
                            console.info("Transcribing started");
                        }, (e: string): void => {
                            done(e);
                        });
                    } catch (error) {
                        done(error);
                    }
                });
                ct.recognized = ((s: sdk.ConversationTranslator, e: sdk.TranslationRecognitionEventArgs): void => {
                    console.info("Recongized " + e.result.text);
                    console.info(e.result);
                    if (e.result.text !== "") {
                        expect(e.result.text).toContain("weather");
                        ct.stopTranscribingAsync(
                            (): void => {
                                console.info("Stopping transcription");
                                ct.leaveConversationAsync((): void => {
                                    c.endConversationAsync(
                                        done,
                                        (e: string): void => {
                                            done(e);
                                        });
                                },
                                    (e: string): void => {
                                        done(e);
                                    });
                            },
                            (e: string): void => {
                                done(e);
                            });
                    }
                });
                ct.transcribed = ((s: sdk.ConversationTranslator, e: sdk.ConversationTranslationEventArgs): void => {
                    console.info("Transcribed " + e.result.text);
                    expect(e.result.text).toContain("weather");
                });

                const lang: string = "en-US";
                const nickname: string = "Tester";
                ct.joinConversationAsync(c.conversationId, nickname, lang,
                    ((): void => {
                        // continue
                    }),
                    ((error: any): void => {
                        done(error);
                    }));
            });
        }),
            ((error: any): void => {
                console.warn("Error starting conversation: " + error);
                done();
            }));
    });

    test.skip("Start Conversation, join as host and connect to CTS endpoint", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Start Conversation, join as host and connect to CTS endpoint");

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.ConversationTranscriptionKey, Settings.ConversationTranscriptionRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Endpoint], Settings.ConversationTranslatorSwedenEndpoint);

        const c: sdk.Conversation = sdk.Conversation.createConversationAsync(config, ((): void => {
            objsToClose.push(c);

            // audio config
            const audioConfig: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
            objsToClose.push(audioConfig);

            const ct: sdk.ConversationTranslator = new sdk.ConversationTranslator(audioConfig);
            objsToClose.push(ct);

            if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }

            ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Endpoint], Settings.ConversationTranslatorSwedenEndpoint);

            const propName: string = "foo";
            const propValue: string = "bar";

            ct.setServiceProperty(propName, propValue);

            const currentProperties: IStringDictionary<string> = JSON.parse(ct.properties.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;
            expect(currentProperties[propName]).toEqual(propValue);

            c.startConversationAsync((): void => {
                // Check that uri for service connection contains service property and value
                const detachObject: IDetachable = Events.instance.attachListener({
                    onEvent: (event: PlatformEvent): void => {
                        if (event instanceof ConnectionStartEvent) {
                            const connectionEvent: ConnectionStartEvent = event as ConnectionStartEvent;
                            const uri: string = connectionEvent.uri;
                            expect(uri).not.toBeUndefined();
                            if (!uri.includes("capito")) {
                                // Make sure there's only a single ? in the URL.
                                expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));
                                expect(uri).toContain(`${propName}=${propValue}`);
                                void detachObject.detach();
                            }
                        }
                    },
                });
                ct.participantsChanged = ((s: sdk.ConversationTranslator, e: sdk.ConversationParticipantsChangedEventArgs): void => {
                    try {
                        ct.startTranscribingAsync();
                    } catch (error) {
                        done(error);
                    }
                });
                ct.recognized = ((s: sdk.ConversationTranslator, e: sdk.TranslationRecognitionEventArgs): void => {
                    if (e.result.text !== "") {
                        expect(e.result.text).toContain("weather");
                        ct.stopTranscribingAsync(
                            (): void => {
                                ct.leaveConversationAsync((): void => {
                                    c.endConversationAsync(
                                        done,
                                        (e: string): void => {
                                            done(e);
                                        });
                                },
                                    (e: string): void => {
                                        done(e);
                                    });
                            },
                            (e: string): void => {
                                done(e);
                            });
                    }
                });

                const lang: string = "en-US";
                const nickname: string = "Tester";
                ct.joinConversationAsync(c.conversationId, nickname, lang,
                    ((): void => {
                        // continue
                    }),
                    ((error: any): void => {
                        done(error);
                    }));
            });
        }),
            ((error: any): void => {
                done();
            }));
    });
});
// Conversation Translator tests: begin
describe("conversation translator constructor tests", (): void => {

    test("Create Conversation Translator, empty constructor", (): void => {
        expect((): sdk.ConversationTranslator => new sdk.ConversationTranslator()).not.toBeUndefined();
    });

    test("Create Conversation Translator, null constructor", (): void => {
        expect((): sdk.ConversationTranslator => new sdk.ConversationTranslator(null)).not.toBeUndefined();
    });

    test("Create Conversation Translator, undefined constructor", (): void => {
        expect((): sdk.ConversationTranslator => new sdk.ConversationTranslator(undefined)).not.toBeUndefined();
    });

    test("Create Conversation Translator, empty constructor", (): void => {
        expect((): sdk.ConversationTranslator => new sdk.ConversationTranslator()).not.toBeUndefined();
    });
});

describe("conversation translator config tests", (): void => {

    test("Create Conversation Translator, audio config", (): void => {

        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        objsToClose.push(audioConfig);
        const ct = new sdk.ConversationTranslator(audioConfig);
        objsToClose.push(ct);

        expect(ct.properties).not.toBeUndefined();
    });

});

describe("conversation translator service tests", (): void => {

    test("Join Conversation Translator, invalid conversation code [400027]", (done: jest.DoneCallback) => {

        // eslint-disable-next-line no-console
        console.info("Join Conversation Translator, invalid conversation code [400027]");

        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        objsToClose.push(audioConfig);
        const ct = new sdk.ConversationTranslator(audioConfig);
        objsToClose.push(ct);
        const code: string = "abcde";
        const lang: string = "en-US";
        const nickname: string = "Tester";

        if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
        if (speechEndpointHost !== "") { ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

        let errorMessage: string;

        ct.joinConversationAsync(code, nickname, lang,
            undefined,
            ((error: any) => {
                try {
                    expect(error).toContain("400027");
                } catch (e) {
                    done(e);
                }
                errorMessage = error;
            }));

        WaitForCondition(() => (errorMessage !== undefined), done);

    });

    test("Join Conversation Translator, duplicate nickname [400028]", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Join Conversation Translator, duplicate nickname [400028]");

        let errorMessage: string = "";

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }
        config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Name], "Tester");
        objsToClose.push(config);

        const c = sdk.Conversation.createConversationAsync(config, (): void => {
            objsToClose.push(c);

            c.startConversationAsync((): void => {

                const ct = new sdk.ConversationTranslator();
                objsToClose.push(ct);

                if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
                if (speechEndpointHost !== "") { ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

                const nickname: string = "Tester";
                const lang: string = "en-US";

                ct.joinConversationAsync(c.conversationId, nickname, lang,
                    (): void => {
                        // continue
                    },
                    (error: any): void => {
                        try {
                            expect(error).toContain("400028");
                            c.endConversationAsync((): void => {
                                errorMessage = error as string;
                            },
                                (error: any): void => {
                                    done();
                                });
                        } catch (e) {
                            done(e);
                        }
                    });
            },
                (error: any): void => {
                    done();
                });

        },
            (error: any): void => {
                done();
            });

        WaitForCondition((): boolean => (errorMessage !== ""), done);

    }, 80000);

    test.skip("Join Conversation Translator, locked conversation [400044]", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Join Conversation Translator, locked conversation [400044]");

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }
        objsToClose.push(config);

        const c = sdk.Conversation.createConversationAsync(config, ((): void => {
            objsToClose.push(c);

            const ct = new sdk.ConversationTranslator();
            objsToClose.push(ct);

            if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
            if (speechEndpointHost !== "") { ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

            const nickname: string = "Tester";
            const lang: string = "en-US";
            let errorMessage: string = "";

            c.startConversationAsync(() => {
                c.lockConversationAsync();
                ct.joinConversationAsync(c.conversationId, nickname, lang,
                    (() => {
                        // continue
                    }),
                    ((error: any) => {
                        try {
                            expect(error).toContain("400044");
                            c.endConversationAsync(() => {
                                errorMessage = error;
                            },
                                (error: any) => {
                                    done();
                                });
                        } catch (e) {
                            done(e);
                        }
                    }));
            });

            WaitForCondition(() => (errorMessage !== ""), done);
        }));
    }, 80000);

    test.skip("Start Conversation Translator, join as host with speech language and speak", (done: jest.DoneCallback): void => {

        // eslint-disable-next-line no-console
        console.info("Start Conversation, join as host with speech language and speak");

        // audio config
        const audioConfig: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
        objsToClose.push(audioConfig);

        // start a conversation
        const config = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        if (endpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.ConversationTranslator_Host], endpointHost); }
        if (speechEndpointHost !== "") { config.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }
        objsToClose.push(config);

        const c = sdk.Conversation.createConversationAsync(config, ((): void => {
            objsToClose.push(c);

            const ct = new sdk.ConversationTranslator(audioConfig);
            objsToClose.push(ct);

            if (endpointHost !== "") { ct.properties.setProperty(sdk.PropertyId.ConversationTranslator_Host, endpointHost); }
            if (speechEndpointHost !== "") { ct.properties.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_Host], speechEndpointHost); }

            const nickname: string = "Tester";
            const lang: string = "en-US";

            c.startConversationAsync((): void => {
                ct.participantsChanged = ((s: sdk.ConversationTranslator, e: sdk.ConversationParticipantsChangedEventArgs): void => {
                    try {
                        ct.startTranscribingAsync();
                    } catch (error) {
                        done(error);
                    }
                });
                ct.transcribed = ((s: sdk.ConversationTranslator, e: sdk.ConversationTranslationEventArgs): void => {
                    expect(e.result.text).toContain("weather");
                    ct.stopTranscribingAsync(
                        (): void => {
                            ct.leaveConversationAsync((): void => {
                                c.endConversationAsync(
                                    done,
                                    (e: string): void => {
                                        done(e);
                                    });
                            },
                                (e: string): void => {
                                    done(e);
                                });
                        },
                        (e: string): void => {
                            done(e);
                        });
                });
                ct.joinConversationAsync(c.conversationId, nickname, lang,
                    ((): void => {
                        // continue
                    }),
                    ((error: any): void => {
                        done(error);
                    }));
            });
        }));

    }, 90000);

});
