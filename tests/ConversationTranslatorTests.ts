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
    Events,
    EventType,
} from "../src/common/Exports";
import { Settings } from "./Settings";

// tslint:disable-next-line:no-console
const consoleInfo = console.info;

const endpointHost: string = Settings.ConversationTranslatorHost;
const speechEndpointHost: string = Settings.ConversationTranslatorSpeechHost;

// tslint:disable-next-line:no-console
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

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
    beforeAll(() => jest.setTimeout(90 * 1000));
});

// Test cases are run linearly, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
beforeEach(() => {
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
});

afterEach(() => {
    // tslint:disable-next-line:no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    objsToClose.forEach((value: any, index: number, array: any[]) => {
        if (typeof value.close === "function") {
            value.close();
        }
    });
});

// Conversation tests: begin
describe("conversation constructor tests", () => {

    test("Create Conversation, null constructor", () => {
        expect(() => sdk.Conversation.createConversationAsync(null)).toThrowError();
    });

    test("Create Conversation, undefined constructor", () => {
        expect(() => sdk.Conversation.createConversationAsync(undefined)).toThrowError();
    });
});

// Conversation Translator tests: begin
describe("conversation translator constructor tests", () => {

    test("Create Conversation Translator, empty constructor", () => {
        expect(() => new sdk.ConversationTranslator()).not.toBeUndefined();
    });

    test("Create Conversation Translator, null constructor", () => {
        expect(() => new sdk.ConversationTranslator(null)).not.toBeUndefined();
    });

    test("Create Conversation Translator, undefined constructor", () => {
        expect(() => new sdk.ConversationTranslator(undefined)).not.toBeUndefined();
    });

    test("Create Conversation Translator, empty constructor", () => {
        expect(() => new sdk.ConversationTranslator()).not.toBeUndefined();
    });
});
