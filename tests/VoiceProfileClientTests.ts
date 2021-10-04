// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import {
    Events,
    EventType
} from "../src/common/Exports";
import { VoiceProfileEnrollmentResult } from "../src/sdk/VoiceProfileEnrollmentResult";
import { VoiceProfilePhraseResult } from "../src/sdk/VoiceProfilePhraseResult";

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

test("VoiceProfileClient with Bad credentials throws meaningful error", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: VoiceProfileClient with Bad credentials throws meaningful error");
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("BADKEY", Settings.SpeakerIDRegion);
    objsToClose.push(s);
    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;
    try {
        const res: sdk.VoiceProfile = await r.createProfileAsync(type, "en-us");
        done.fail();
    } catch (error) {
        const expectedCode: number = 401;
        const expectedMessage: string = "Access denied due to invalid subscription key or wrong API endpoint. Make sure to provide a valid key for an active subscription and use a correct regional API endpoint for your resource.";
        expect(error.toString()).toEqual(`Error: createProfileAsync failed with code: ${expectedCode}, message: ${expectedMessage}`);
        done();
    }
});

test("GetParameters", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: GetParameters");
    const r: sdk.VoiceProfileClient = BuildClient();
    objsToClose.push(r);

    expect(r.properties).not.toBeUndefined();
});

test("Get Authorization Phrases for enrollment", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Get Authorization Phrases for enrollment");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    try {
        const res: VoiceProfilePhraseResult = await r.getActivationPhrasesAsync(sdk.VoiceProfileType.TextDependentVerification, "en-us");
        expect(res.reason).not.toBeUndefined();
        expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrollingVoiceProfile]);
        expect(res.phrases).not.toBeUndefined();
        expect(res.phrases.length).toBeGreaterThan(0);
        expect(res.phrases[0]).not.toBeUndefined();
        done();
    } catch (error) {
        done.fail(error);
    }
}, 20000);

test("Get Activation Phrases for enrollment", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Get Activation Phrases for enrollment");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);
    const types: sdk.VoiceProfileType[] = [sdk.VoiceProfileType.TextIndependentVerification, sdk.VoiceProfileType.TextIndependentIdentification];

    types.forEach(async (type: sdk.VoiceProfileType) => {
        try {
            const res: VoiceProfilePhraseResult = await r.getActivationPhrasesAsync(type, "en-us");
            expect(res.reason).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrollingVoiceProfile]);
            expect(res.phrases).not.toBeUndefined();
            expect(res.phrases.length).toBeGreaterThan(0);
            expect(res.phrases[0]).not.toBeUndefined();
            done();
        } catch (error) {
            done.fail(error);
        }
    });
}, 40000);

test("Create and Delete Voice Profile using push stream - Independent Identification", async (done: jest.DoneCallback) => {

    // tslint:disable-next-line:no-console
    console.info("Name: Create and Delete Voice Profile using push stream - Independent Identification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;
    try {
        const res: sdk.VoiceProfile = await r.createProfileAsync(type, "en-us");
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
        let resultReason: sdk.ResultReason = sdk.ResultReason.EnrollingVoiceProfile;
        let result: VoiceProfileEnrollmentResult;
        while (resultReason === sdk.ResultReason.EnrollingVoiceProfile) {
            result = await r.enrollProfileAsync(res, config);
            resultReason = result.reason;
            expect(result).not.toBeUndefined();
            expect(result.reason).not.toBeUndefined();
        }
        expect(sdk.ResultReason[resultReason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrolledVoiceProfile]);
        expect(result.enrollmentsCount).toEqual(1);
        expect(() => sdk.SpeakerVerificationModel.fromProfile(res)).toThrow();
        try {
            const resetResult: sdk.VoiceProfileResult = await r.resetProfileAsync(res);
            expect(resetResult).not.toBeUndefined();
            expect(resetResult.reason).not.toBeUndefined();
            expect(sdk.ResultReason[resetResult.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.ResetVoiceProfile]);
            try {
                const result: sdk.VoiceProfileResult = await r.deleteProfileAsync(res);
                expect(result).not.toBeUndefined();
                expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.DeletedVoiceProfile]);
                done();
            } catch (error) {
                done.fail(error);
            }
        } catch (error) {
            done.fail(error);
        }
    } catch (error) {
        done.fail(error);
    }
}, 40000);

test("Create and Delete Voice Profile - Independent Identification", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create and Delete Voice Profile - Independent Identification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;
    try {
        const res: sdk.VoiceProfile = await r.createProfileAsync(type, "en-us");
        expect(res).not.toBeUndefined();
        expect(res.profileId).not.toBeUndefined();
        expect(res.profileType).not.toBeUndefined();
        expect(res.profileType).toEqual(type);

        const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.IndependentIdentificationWaveFile);
        let resultReason: sdk.ResultReason = sdk.ResultReason.EnrollingVoiceProfile;
        let result: VoiceProfileEnrollmentResult;
        while (resultReason === sdk.ResultReason.EnrollingVoiceProfile) {
            result = await r.enrollProfileAsync(res, config);
            resultReason = result.reason;
            expect(result).not.toBeUndefined();
            expect(result.reason).not.toBeUndefined();
        }
        expect(sdk.ResultReason[resultReason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrolledVoiceProfile]);
        expect(result.enrollmentsCount).toEqual(1);
        expect(() => sdk.SpeakerVerificationModel.fromProfile(res)).toThrow();

        try {
            const resetResult: sdk.VoiceProfileResult = await r.resetProfileAsync(res);
            expect(resetResult).not.toBeUndefined();
            expect(resetResult.reason).not.toBeUndefined();
            expect(sdk.ResultReason[resetResult.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.ResetVoiceProfile]);
            try {
                const result: sdk.VoiceProfileResult = await r.deleteProfileAsync(res);
                expect(result).not.toBeUndefined();
                expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.DeletedVoiceProfile]);
                done();
            } catch (error) {
                done.fail(error);
            }
        } catch (error) {
            done.fail(error);
        }
    } catch (error) {
        done.fail(error);
    }
}, 15000);

test("Create, Get, and Delete Voice Profile - Independent Verification", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create, Get, and Delete Voice Profile - Independent Verification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentVerification;
    try {
        const res: sdk.VoiceProfile = await r.createProfileAsync(type, "en-us");
        expect(res).not.toBeUndefined();
        expect(res.profileId).not.toBeUndefined();
        expect(res.profileType).not.toBeUndefined();
        expect(res.profileType).toEqual(type);
        expect(() => sdk.SpeakerIdentificationModel.fromProfiles([res])).toThrow();
        try {
            const enrollmentRes: sdk.VoiceProfileEnrollmentResult = await r.retrieveEnrollmentResultAsync(res);
            expect(enrollmentRes).not.toBeUndefined();
            expect(enrollmentRes.enrollmentResultDetails.profileId).not.toBeUndefined();
            expect(enrollmentRes.enrollmentResultDetails.profileId).toEqual(res.profileId);
            expect(enrollmentRes.enrollmentsCount).toEqual(0);
            expect(enrollmentRes.enrollmentResultDetails.remainingEnrollmentsSpeechLength).toBeGreaterThan(0);
            try {
                const results: sdk.VoiceProfileEnrollmentResult[] = await r.getAllProfilesAsync(res.profileType);
                expect(results).not.toBeUndefined();
                expect(results.length).toBeGreaterThan(0);
                expect(results[0]).not.toBeUndefined();
                expect(results[0].enrollmentResultDetails.profileId).not.toBeUndefined();
                expect(results[0].enrollmentResultDetails.enrollmentStatus).not.toBeUndefined();
                try {
                    const result: sdk.VoiceProfileResult = await r.deleteProfileAsync(res);
                    expect(result).not.toBeUndefined();
                    // expect(result.reason).toEqual(sdk.ResultReason.DeletedVoiceProfile);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            } catch (error) {
                done.fail(error);
            }
        } catch (error) {
            done.fail(error);
        }
    } catch (error) {
        done.fail(error);
    }
}, 15000);

test("Create and Delete Voice Profile - Dependent Verification", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create and Delete Voice Profile - Dependent Verification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextDependentVerification;
    try {
        const res: sdk.VoiceProfile = await r.createProfileAsync(type, "en-us");
        expect(res).not.toBeUndefined();
        expect(res.profileId).not.toBeUndefined();
        expect(res.profileType).not.toBeUndefined();
        expect(res.profileType).toEqual(type);
        const configs: sdk.AudioConfig[] = [];
        Settings.VerificationWaveFiles.forEach((file: string) => {
            configs.push(WaveFileAudioInput.getAudioConfigFromFile(file));
        });
        let enrollmentCount: number = 1;
        let result: VoiceProfileEnrollmentResult;
        for (const config of configs) {
            result = await r.enrollProfileAsync(res, config);
            if (result.reason === sdk.ResultReason.Canceled) {
                done.fail("Enrollment unexpectedly canceled");
            }
            expect(result).not.toBeUndefined();
            expect(result.reason).not.toBeUndefined();
            expect(result.enrollmentsCount).toEqual(enrollmentCount);
            enrollmentCount += 1;
        }
        expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrolledVoiceProfile]);
        const reco: sdk.SpeakerRecognizer = BuildRecognizer();
        const m: sdk.SpeakerVerificationModel = sdk.SpeakerVerificationModel.fromProfile(res);
        try {
            const recognizeResult: sdk.SpeakerRecognitionResult = await reco.recognizeOnceAsync(m);
            expect(recognizeResult).not.toBeUndefined();
            expect(recognizeResult.reason).not.toBeUndefined();
            expect(sdk.ResultReason[recognizeResult.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeaker]);
            expect(recognizeResult.profileId).toEqual(res.profileId);
            try {
                const result: sdk.VoiceProfileResult = await r.deleteProfileAsync(res);
                expect(result).not.toBeUndefined();
                expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.DeletedVoiceProfile]);
                done();
            } catch (error) {
                done.fail(error);
            }
        } catch (error) {
            done.fail(error);
        }
    } catch (error) {
        done.fail(error);
    }
}, 15000);
