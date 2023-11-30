// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import { Events } from "../src/common/Exports";
import { VoiceProfileEnrollmentResult } from "../src/sdk/VoiceProfileEnrollmentResult";
import { VoiceProfilePhraseResult } from "../src/sdk/VoiceProfilePhraseResult";

import { Settings } from "./Settings";
import { closeAsyncObjects } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


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
    // eslint-disable-next-line no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

jest.retryTimes(Settings.RetryCount);
jest.setTimeout(60000);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
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

const BuildRecognizer: (speechConfig?: sdk.SpeechConfig, audioFile?: string) => sdk.SpeakerRecognizer = (speechConfig?: sdk.SpeechConfig, audioFile?: string): sdk.SpeakerRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }
    let audioConfig: sdk.AudioConfig;
    if (audioFile === undefined) {
        audioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.DependentVerificationWaveFile);
    } else {
        audioConfig = WaveFileAudioInput.getAudioConfigFromFile(audioFile);
    }

    objsToClose.push(audioConfig);
    const r: sdk.SpeakerRecognizer = new sdk.SpeakerRecognizer(s, audioConfig);
    expect(r).not.toBeUndefined();
    objsToClose.push(r);

    return r;
};

test("VoiceProfileClient", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: VoiceProfileClient");
    const r: sdk.VoiceProfileClient = BuildClient();
    objsToClose.push(r);
});

test.skip("VoiceProfileClient with Bad credentials throws meaningful error", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: VoiceProfileClient with Bad credentials throws meaningful error");
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("BADKEY", Settings.SpeakerIDRegion);
    objsToClose.push(s);
    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;
    try {
        const res: sdk.VoiceProfile = await r.createProfileAsync(type, "en-us");
        void res;
        return Promise.reject("Call did not fail.");
    } catch (error) {
        const expectedMessage: string = "Unable to contact server. StatusCode: 1006, undefined Reason:  undefined";
        expect(error as string).toEqual(expectedMessage);
    }
});

test("VoiceProfileClient with Bad profile throws meaningful error", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: VoiceProfileClient with Bad profile throws meaningful error");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;

    const badProfile: sdk.VoiceProfile = new sdk.VoiceProfile("12345678-1234-5678-1234-BADBADBADBAD", type);

    const res: sdk.VoiceProfileResult = await r.resetProfileAsync(badProfile);
    expect(res.reason).not.toBeUndefined();
    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);
    expect(res.errorDetails).not.toBeUndefined();
    expect(res.errorDetails).toEqual("statusCode: PROFILENOTFOUND, errorDetails: Profile Not Found.");
});

test("GetParameters", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: GetParameters");
    const r: sdk.VoiceProfileClient = BuildClient();
    objsToClose.push(r);

    expect(r.properties).not.toBeUndefined();
});

test("Get Authorization Phrases for enrollment", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Get Authorization Phrases for enrollment");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const res: VoiceProfilePhraseResult = await r.getActivationPhrasesAsync(sdk.VoiceProfileType.TextDependentVerification, "en-us");
    expect(res.reason).not.toBeUndefined();
    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrollingVoiceProfile]);
    expect(res.phrases).not.toBeUndefined();
    expect(res.phrases.length).toBeGreaterThan(0);
    expect(res.phrases[0]).not.toBeUndefined();

});

test("Get Activation Phrases for enrollment", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Get Activation Phrases for enrollment");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);
    const types: sdk.VoiceProfileType[] = [sdk.VoiceProfileType.TextIndependentVerification, sdk.VoiceProfileType.TextIndependentIdentification];

    for (const type of types) {
        try {
            const res: VoiceProfilePhraseResult = await r.getActivationPhrasesAsync(type, "en-us");
            expect(res.reason).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrollingVoiceProfile]);
            expect(res.phrases).not.toBeUndefined();
            expect(res.phrases.length).toBeGreaterThan(0);
            expect(res.phrases[0]).not.toBeUndefined();
        } catch (error) {
            expect(error).toBeFalsy();
        }
    }
}, 40000);

test("Create and Delete Voice Profile using push stream - Independent Identification", async (): Promise<void> => {

    // eslint-disable-next-line no-console
    console.info("Name: Create and Delete Voice Profile using push stream - Independent Identification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;

    const res: sdk.VoiceProfile = await r.createProfileAsync(type, "en-us");
    expect(res).not.toBeUndefined();
    expect(res.profileId).not.toBeUndefined();
    expect(res.profileType).not.toBeUndefined();
    expect(res.profileType).toEqual(type);

    // Attempting to recognize should fail before enrollment.
    const reco: sdk.SpeakerRecognizer = BuildRecognizer(s, Settings.IndependentIdentificationWaveFile);
    const m: sdk.SpeakerIdentificationModel = sdk.SpeakerIdentificationModel.fromProfiles([res]);
    objsToClose.push(m);
    try {
        const recognizeResult: sdk.SpeakerRecognitionResult = await reco.recognizeOnceAsync(m);
        expect(recognizeResult).not.toBeUndefined();
        expect(recognizeResult.reason).not.toBeUndefined();
        expect(recognizeResult.errorDetails).toEqual("IncompleteEnrollment");
    } catch (error) {
        expect(error).toBeFalsy();
    }
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

    // Independent Identification should now work.
    const workingReco: sdk.SpeakerRecognizer = BuildRecognizer(s, Settings.IndependentIdentificationWaveFile);
    const identificationModel: sdk.SpeakerIdentificationModel = sdk.SpeakerIdentificationModel.fromProfiles([res]);
    objsToClose.push(identificationModel);
    try {
        const workingRecognizeResult: sdk.SpeakerRecognitionResult = await workingReco.recognizeOnceAsync(identificationModel);
        expect(workingRecognizeResult).not.toBeUndefined();
        expect(workingRecognizeResult.reason).not.toBeUndefined();
        expect(sdk.ResultReason[workingRecognizeResult.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeakers]);
    } catch (error) {
        expect(error).toBeFalsy();
    }
    const resetResult: sdk.VoiceProfileResult = await r.resetProfileAsync(res);
    expect(resetResult).not.toBeUndefined();
    expect(resetResult.reason).not.toBeUndefined();
    expect(sdk.ResultReason[resetResult.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.ResetVoiceProfile]);
    const result2: sdk.VoiceProfileResult = await r.deleteProfileAsync(res);
    expect(result2).not.toBeUndefined();
    expect(sdk.ResultReason[result2.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.DeletedVoiceProfile]);

});

test("Create and Delete Voice Profile - Independent Identification", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Create and Delete Voice Profile - Independent Identification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentIdentification;
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
    expect((): sdk.SpeakerVerificationModel => sdk.SpeakerVerificationModel.fromProfile(res)).toThrow();

    const resetResult: sdk.VoiceProfileResult = await r.resetProfileAsync(res);
    expect(resetResult).not.toBeUndefined();
    expect(resetResult.reason).not.toBeUndefined();
    expect(sdk.ResultReason[resetResult.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.ResetVoiceProfile]);

    const result2: sdk.VoiceProfileResult = await r.deleteProfileAsync(res);
    expect(result2).not.toBeUndefined();
    expect(sdk.ResultReason[result2.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.DeletedVoiceProfile]);

});

test("Create and Delete Voice Profile - Independent Verification", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Create and Delete Voice Profile - Independent Verification");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.VoiceProfileClient = BuildClient(s);
    objsToClose.push(r);

    const type: sdk.VoiceProfileType = sdk.VoiceProfileType.TextIndependentVerification;

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

    const resetResult: sdk.VoiceProfileResult = await r.resetProfileAsync(res);
    expect(resetResult).not.toBeUndefined();
    expect(resetResult.reason).not.toBeUndefined();
    expect(sdk.ResultReason[resetResult.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.ResetVoiceProfile]);
    const result2: sdk.VoiceProfileResult = await r.deleteProfileAsync(res);
    expect(result2).not.toBeUndefined();
    expect(sdk.ResultReason[result2.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.DeletedVoiceProfile]);

});

test("Create, Get, and Delete Voice Profile - Independent Verification", async (): Promise<void> => {
    // eslint-disable-next-line no-console
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
        expect((): sdk.SpeakerIdentificationModel => sdk.SpeakerIdentificationModel.fromProfiles([res])).toThrow();
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
                } catch (error) {
                    expect(error).toBeFalsy();
                }
            } catch (error) {
                expect(error).toBeFalsy();
            }
        } catch (error) {
            expect(error).toBeFalsy();
        }
    } catch (error) {
        expect(error).toBeFalsy();
    }
}, 15000);

test("Create and Delete Voice Profile - Dependent Verification", async (): Promise<void> => {
    // eslint-disable-next-line no-console
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
        for (const file of Settings.VerificationWaveFiles) {
            configs.push(WaveFileAudioInput.getAudioConfigFromFile(file));
        }
        let enrollmentCount: number = 1;
        let result: VoiceProfileEnrollmentResult;
        for (const config of configs) {
            result = await r.enrollProfileAsync(res, config);
            if (result.reason === sdk.ResultReason.Canceled) {
                throw new Error("Enrollment unexpectedly canceled");
            }
            expect(result).not.toBeUndefined();
            expect(result.reason).not.toBeUndefined();
            expect(result.enrollmentsCount).toEqual(enrollmentCount);
            enrollmentCount += 1;
        }
        expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.EnrolledVoiceProfile]);
        const reco: sdk.SpeakerRecognizer = BuildRecognizer();
        const m: sdk.SpeakerVerificationModel = sdk.SpeakerVerificationModel.fromProfile(res);
        objsToClose.push(m);
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
            } catch (error) {
                expect(error).toBeFalsy();
            }
        } catch (error) {
            expect(error).toBeFalsy();
        }
    } catch (error) {
        expect(error).toBeFalsy();
    }
}, 45000);
