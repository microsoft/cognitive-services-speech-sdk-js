// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { CertCheckAgent } from "../src/common.browser/CertChecks";
import {
    ConsoleLoggingListener
} from "../src/common.browser/Exports";
import {
    Events,
    EventType,
    IDetachable,
    OCSPEvent,
    PlatformEvent
} from "../src/common/Exports";
import { Settings } from "./Settings";
import { WaitForPromise } from "./Utilities";

import * as fs from "fs";
import * as os from "os";
import path from "path";
import got from "got";
import rimraf from "rimraf";

const origCacehDir: string = process.env.SPEECH_OSCP_CACHE_ROOT;
let cacheDir: string;
let events: OCSPEvent[];
let currentListener: IDetachable;

beforeAll(() => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

beforeEach(() => {
    // tslint:disable-next-line:no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // tslint:disable-next-line:no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
    cacheDir = path.join(os.tmpdir(), Math.random().toString(36).substr(2, 15));
    process.env.SPEECH_OCSP_CACHE_ROOT = cacheDir;
    fs.mkdirSync(cacheDir);
    events = [];
    currentListener = Events.instance.attach((event: PlatformEvent): void => {
        if (event.name.startsWith("OCSP")) {
            events.push(event as OCSPEvent);
        }
    });
    CertCheckAgent.forceReinitDiskCache();
    CertCheckAgent.testTimeOffset = 0;
});

jest.retryTimes(Settings.RetryCount);

afterEach(() => {
    // tslint:disable-next-line:no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    rimraf(cacheDir, (error: Error): void => {
        // tslint:disable-next-line:no-console
        console.info("Error " + Error.toString() + " cleaning up.");
    });
    currentListener.detach().catch();
    currentListener = null;
});

afterAll(() => {
    process.env.SPEECH_OSCP_CACHE_ROOT = origCacehDir;
});

function findEvent(eventName: string): number {
    let found: number = 0;
    events.forEach((event: OCSPEvent, index: number, array: OCSPEvent[]): void => {
        if (event.name === eventName) {
            found++;
        }
    });

    return found;
}

function waitForEvents(eventName: string, eventCount: number, rejectMessage?: string, timeoutMS: number = 5000): Promise<void> {
    return WaitForPromise((): boolean => {
        return findEvent(eventName) === eventCount;
    }, rejectMessage === undefined ? eventName : rejectMessage, timeoutMS);
}

const makeRequest = (disableOCSPStapling: boolean = true): Promise<void> => {
    return new Promise(async (resolve: (value: void) => void, reject: (reason: string) => void): Promise<void> => {
        const testUrl: string = "https://www.microsoft.com/";

        const agent: CertCheckAgent = new CertCheckAgent();
        CertCheckAgent.forceDisableOCSPStapling = disableOCSPStapling;

        try {
            await got(testUrl, {
                agent: { http: agent.GetAgent() },
                followRedirect: false,
            });
        } catch (error) {
            if (error !== null) {
                reject(error);
            } else {
                resolve();
            }
        }
    });
}

// https://github.com/chromium/badssl.com/issues/477
test.skip("Test OCSP Revoked", async (done: jest.DoneCallback): Promise<void> => {
    // tslint:disable-next-line:no-console
    console.info("Name: Test OCSP Revoked");

    const testUrl: string = "https://revoked.badssl.com/";

    const agent: CertCheckAgent = new CertCheckAgent();

    try {
        await got(testUrl, {
            agent: { http: agent.GetAgent() },
            followRedirect: false,
        });
    } catch (error) {
        try {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();
            expect(error.toString()).toContain("revoked");
            done();
        } catch (ex) {
            done(ex);
        }
    }
});

test.skip("Test OCSP Staple", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Test OCSP Staple");

    await makeRequest(false);
    await waitForEvents("OCSPStapleReceivedEvent", 1);
    await waitForEvents("OCSPResponseRetrievedEvent", 0);
    done();
});

test.skip("Test OCSP Basic", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Test OCSP Basic");

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);
    done();
});

test.skip("Test OCSP 2nd request mem cache hit.", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Test OCSP 2nd request mem cache hit.");

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);

    events = [];

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 0);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 0);
    await waitForEvents("OCSPDiskCacheStoreEvent", 0);
    await waitForEvents("OCSPDiskCacheHitEvent", 0);
    await waitForEvents("OCSPMemoryCacheHitEvent", 1);

    done();
});

test.skip("Test OCSP expirey refreshes.", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Test OCSP expirey refreshes.");

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);

    events = [];
    CertCheckAgent.testTimeOffset = 1000 * 60 * 60 * 24 * 7.5;

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheHitEvent", 0);
    await waitForEvents("OCSPCacheEntryExpiredEvent", 1);
    done();
});

test.skip("Test OCSP expirey approaching refreshes.", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Test OCSP expirey approaching  refreshes.");

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);

    events = [];
    CertCheckAgent.testTimeOffset = 1000 * 60 * 60 * 24 * 3.5;

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);
    await waitForEvents("OCSPCacheUpdateNeededEvent", 1);
    await waitForEvents("OCSPCacheUpdateCompleteEvent", 1);
    done();
});

test.skip("Test OCSP invalid cert refreshes.", async (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name:  invalid cert refreshes.");

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 1);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);

    events = [];
    CertCheckAgent.forceReinitDiskCache();

    const dir: string = path.join(cacheDir, "if-you-need-to-delete-this-open-an-issue-async-disk-cache", "microsoft-cognitiveservices-speech-sdk-cache");
    fs.readdir(dir, (error: NodeJS.ErrnoException, files: string[]): void => {
        files.forEach((value: string, index: number, array: string[]): void => {
            const file: string = path.join(dir, value);
            const content: Buffer = fs.readFileSync(file);
            content.set([2], 7);
            fs.writeFileSync(file, content);
        });
    });

    await makeRequest();
    await waitForEvents("OCSPResponseRetrievedEvent", 1);
    await waitForEvents("OCSPMemoryCacheStoreEvent", 2);
    await waitForEvents("OCSPDiskCacheStoreEvent", 1);
    await waitForEvents("OCSPCacheFetchErrorEvent", 1);
    await waitForEvents("OCSPCacheMissEvent", 1);

    done();

});
