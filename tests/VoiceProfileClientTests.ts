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

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

beforeEach(() => {
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // tslint:disable-next-line:no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

afterEach(async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
    done();
});

const BuildClient: (speechConfig?: sdk.SpeechConfig) => sdk.VoiceProfileClient = (speechConfig?: sdk.SpeechConfig): sdk.VoiceProfileClient => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const r: sdk.VoiceProfileClient = new sdk.VoiceProfileClient(s);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildSpeechConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeakerIDSubscriptionKey, Settings.SpeakerIDRegion);
    expect(s).not.toBeUndefined();
    return s;
};

const BuildRecognizer: (speechConfig?: sdk.SpeechConfig) => sdk.SpeakerRecognizer = (speechConfig?: sdk.SpeechConfig): sdk.SpeakerRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.DependentVerificationWaveFile);
    const r: sdk.SpeakerRecognizer = new sdk.SpeakerRecognizer(s, config);
    expect(r).not.toBeUndefined();

    return r;
};

test("VoiceProfileClient", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: VoiceProfileClient");
    const r: sdk.VoiceProfileClient = BuildClient();
    objsToClose.push(r);
});

test("GetParameters", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: GetParameters");
    const r: sdk.VoiceProfileClient = BuildClient();
    objsToClose.push(r);

    expect(r.properties).not.toBeUndefined();
});

test("Create and Delete Voice Profile using push stream - Independent Identification", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create and Delete Voice Profile using push stream - Independent Identification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;
    r.createProfileAsync(
        type,
        "en-us",
        (res: sdk.VoiceProfile) => {
            expect(res).not.toBeUndefined();
            expect(res.profileId).not.toBeUndefined();
            expect(res.profileType).not.toBeUndefined();
            expect(res.profileType).toEqual(type);
            // Create the push stream we need for the speech sdk.
            const pushStream: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();

            // Open the file and push it to the push stream.
            fs.createReadStream(Settings.IndependentIdentificationWaveFile).on("data", (arrayBuffer: { buffer: ArrayBuffer }) => {
                pushStream.write(arrayBuffer.buffer);
            }).on("end", () => {
                pushStream.close();
            });
            const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
            r.enrollProfileAsync(
                res,
                config,
                (enrollResult: sdk.VoiceProfileEnrollmentResult) => {
                    expect(enrollResult).not.toBeUndefined();
                    expect(enrollResult.reason).not.toBeUndefined();
                    expect(enrollResult.reason).toEqual(sdk.ResultReason.EnrolledVoiceProfile);
                    expect(enrollResult.enrollmentResultDetails.profileId).toEqual(res.profileId);
                    expect(enrollResult.enrollmentResultDetails.enrollmentStatus).toEqual("Enrolled");
                    expect(enrollResult.enrollmentResultDetails.remainingEnrollmentSpeechLength).toEqual(0);
                    expect(enrollResult.enrollmentResultDetails.enrollmentLength).toBeGreaterThan(0);
                    expect(() => sdk.SpeakerVerificationModel.fromProfile(res)).toThrow();
                    r.resetProfileAsync(
                        res,
                        (resetResult: sdk.VoiceProfileResult) => {
                            expect(resetResult).not.toBeUndefined();
                            expect(resetResult.reason).not.toBeUndefined();
                            expect(resetResult.reason).toEqual(sdk.ResultReason.ResetVoiceProfile);
                            r.deleteProfileAsync(
                                res,
                                (result: sdk.VoiceProfileResult) => {
                                    expect(result).not.toBeUndefined();
                                    expect(result.reason).toEqual(sdk.ResultReason.DeletedVoiceProfile);
                                    done();
                                },
                                (error: string) => {
                                    done.fail(error);
                                });
                        },
                        (error: string) => {
                            done.fail(error);
                        });
                },
                (error: string) => {
                    done.fail(error);
                });

        },
        (error: string) => {
            done.fail(error);
        });
}, 20000);

test("Create and Delete Voice Profile - Independent Identification", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create and Delete Voice Profile - Independent Identification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;
    r.createProfileAsync(
        type,
        "en-us",
        (res: sdk.VoiceProfile) => {
            expect(res).not.toBeUndefined();
            expect(res.profileId).not.toBeUndefined();
            expect(res.profileType).not.toBeUndefined();
            expect(res.profileType).toEqual(type);

            const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.IndependentIdentificationWaveFile);
            r.enrollProfileAsync(
                res,
                config,
                (enrollResult: sdk.VoiceProfileEnrollmentResult) => {
                    expect(enrollResult).not.toBeUndefined();
                    expect(enrollResult.reason).not.toBeUndefined();
                    expect(enrollResult.reason).toEqual(sdk.ResultReason.EnrolledVoiceProfile);
                    expect(enrollResult.enrollmentLength).toBeGreaterThan(0);
                    expect(() => sdk.SpeakerVerificationModel.fromProfile(res)).toThrow();
                    r.resetProfileAsync(
                        res,
                        (resetResult: sdk.VoiceProfileResult) => {
                            expect(resetResult).not.toBeUndefined();
                            expect(resetResult.reason).not.toBeUndefined();
                            expect(resetResult.reason).toEqual(sdk.ResultReason.ResetVoiceProfile);
                            r.deleteProfileAsync(
                                res,
                                (result: sdk.VoiceProfileResult) => {
                                    expect(result).not.toBeUndefined();
                                    expect(result.reason).toEqual(sdk.ResultReason.DeletedVoiceProfile);
                                    done();
                                },
                                (error: string) => {
                                    done.fail(error);
                                });
                        },
                        (error: string) => {
                            done.fail(error);
                        });
                },
                (error: string) => {
                    done.fail(error);
                });

        },
        (error: string) => {
            done.fail(error);
        });
}, 20000);

test("Create, Get, and Delete Voice Profile - Independent Verification", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create, Get, and Delete Voice Profile - Independent Verification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentVerification;
    r.createProfileAsync(
        type,
        "en-us",
        (res: sdk.VoiceProfile) => {
            expect(res).not.toBeUndefined();
            expect(res.profileId).not.toBeUndefined();
            expect(res.profileType).not.toBeUndefined();
            expect(res.profileType).toEqual(type);
            expect(() => sdk.SpeakerIdentificationModel.fromProfiles([res])).toThrow();
            r.getProfileStatusAsync(
                res,
                (enrollmentRes: sdk.VoiceProfileEnrollmentResult) => {
                    expect(enrollmentRes).not.toBeUndefined();
                    expect(enrollmentRes.enrollmentResultDetails.profileId).not.toBeUndefined();
                    expect(enrollmentRes.enrollmentResultDetails.profileId).toEqual(res.profileId);
                    expect(enrollmentRes.enrollmentCount).toEqual(0);
                    expect(enrollmentRes.enrollmentResultDetails.remainingEnrollmentCount).toEqual(3);
                    r.getAllProfilesAsync(
                        res.profileType,
                        (results: sdk.VoiceProfileEnrollmentResult[]) => {
                            expect(results).not.toBeUndefined();
                            expect(results.length).toBeGreaterThan(0);
                            expect(results[0]).not.toBeUndefined();
                            expect(results[0].enrollmentResultDetails.profileId).not.toBeUndefined();
                            expect(results[0].enrollmentResultDetails.enrollmentStatus).not.toBeUndefined();
                            r.deleteProfileAsync(
                                res,
                                (result: sdk.VoiceProfileResult) => {
                                    expect(result).not.toBeUndefined();
                                    expect(result.reason).toEqual(sdk.ResultReason.DeletedVoiceProfile);
                                    done();
                                },
                                (error: string) => {
                                    done.fail(error);
                                });
                        },
                        (error: string) => {
                            done.fail(error);
                        });
                },
                (error: string) => {
                    done.fail(error);
                });
        },
        (error: string) => {
            done.fail(error);
        });
}, 15000);

test("Get Authorization Phrases for voice samples", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create and Delete Voice Profile - Dependent Verification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    r.getAuthorizationPhrasesAsync(
        "en-us",
        (phrases: string[]) => {
            expect(phrases).not.toBeUndefined();
            expect(phrases.length).toBeGreaterThan(0);
            expect(phrases[0]).not.toBeUndefined();
            done();
        },
        (error: string) => {
            done.fail(error);
        });
}, 20000);

test("Create and Delete Voice Profile - Dependent Verification", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create and Delete Voice Profile - Dependent Verification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextDependentVerification;
    r.createProfileAsync(
        type,
        "en-us",
        (res: sdk.VoiceProfile) => {
            expect(res).not.toBeUndefined();
            expect(res.profileId).not.toBeUndefined();
            expect(res.profileType).not.toBeUndefined();
            expect(res.profileType).toEqual(type);
            const configs: sdk.AudioConfig[] = [];
            Settings.VerificationWaveFiles.forEach((file: string) => {
                configs.push(WaveFileAudioInput.getAudioConfigFromFile(file));
            });
            r.enrollProfileAsync(
                res,
                configs[0],
                (enrollResult1: sdk.VoiceProfileEnrollmentResult) => {
                    expect(enrollResult1).not.toBeUndefined();
                    expect(enrollResult1.reason).not.toBeUndefined();
                    expect(enrollResult1.reason).toEqual(sdk.ResultReason.EnrollingVoiceProfile);
                    expect(enrollResult1.enrollmentCount).toEqual(1);
                    r.enrollProfileAsync(
                        res,
                        configs[1],
                        (enrollResult2: sdk.VoiceProfileEnrollmentResult) => {
                            expect(enrollResult2).not.toBeUndefined();
                            expect(enrollResult2.reason).not.toBeUndefined();
                            expect(enrollResult2.reason).toEqual(sdk.ResultReason.EnrollingVoiceProfile);
                            expect(enrollResult2.enrollmentCount).toEqual(2);
                            r.enrollProfileAsync(
                                res,
                                configs[2],
                                (enrollResult3: sdk.VoiceProfileEnrollmentResult) => {
                                    expect(enrollResult3).not.toBeUndefined();
                                    expect(enrollResult3.reason).not.toBeUndefined();
                                    expect(enrollResult3.reason).toEqual(sdk.ResultReason.EnrolledVoiceProfile);
                                    expect(enrollResult3.enrollmentCount).toEqual(3);
                                    const reco: sdk.SpeakerRecognizer = BuildRecognizer();
                                    const m: sdk.SpeakerVerificationModel = sdk.SpeakerVerificationModel.fromProfile(res);
                                    reco.recognizeOnceAsync(
                                        m,
                                        (recognizeResult: sdk.SpeakerRecognitionResult) => {
                                            expect(recognizeResult).not.toBeUndefined();
                                            expect(recognizeResult.reason).not.toBeUndefined();
                                            expect(recognizeResult.reason).toEqual(sdk.ResultReason.RecognizedSpeaker);
                                            expect(recognizeResult.profileId).toEqual(res.profileId);
                                            r.deleteProfileAsync(
                                                res,
                                                (result: sdk.VoiceProfileResult) => {
                                                    expect(result).not.toBeUndefined();
                                                    expect(result.reason).toEqual(sdk.ResultReason.DeletedVoiceProfile);
                                                    done();
                                                },
                                                (error: string) => {
                                                    done.fail(error);
                                                });
                                        },
                                        (error: string) => {
                                            done.fail(error);
                                        });
                                },
                                (error: string) => {
                                    done.fail(error);
                                });
                        },
                        (error: string) => {
                            done.fail(error);
                        });
                },
                (error: string) => {
                    done.fail(error);
                });
        },
        (error: string) => {
            done.fail(error);
        });
}, 15000);
