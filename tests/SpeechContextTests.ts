// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
    SpeechContext
} from "../src/common.speech/Exports";
import { Dgi } from "../src/common.speech/ServiceMessages/Dgi/Dgi";
import { Group } from "../src/common.speech/ServiceMessages/Dgi/Group";
import { Item } from "../src/common.speech/ServiceMessages/Dgi/Item";
import { SpeechContext as ServiceSpeechContext } from "../src/common.speech/ServiceMessages/SpeechContext";
import { Settings } from "./Settings";


beforeAll((): void => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

// eslint-disable-next-line no-console
beforeEach((): void => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

test("Emtpy returns empty", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    const ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    const retObj: ServiceSpeechContext = JSON.parse(ret) as ServiceSpeechContext;
    expect(Object.keys(retObj).length).toEqual(0);
});

test("Random section returned", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    speechContext.getContext().test = "testvalue";

    const ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    const retObj: ServiceSpeechContext = JSON.parse(ret) as ServiceSpeechContext;
    expect(retObj.test).toEqual("testvalue");
});

test("Grammar updates", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    dgBuilder.addPhrase("phrase");
    dgBuilder.setWeight(2.0);

    const ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    const retObj: ServiceSpeechContext = JSON.parse(ret) as ServiceSpeechContext;
    expect(retObj).not.toBeUndefined();

    const dgi: Dgi = retObj.dgi;
    expect(dgi).not.toBeUndefined();
    expect(dgi).not.toBeUndefined();
    expect(dgi.groups).not.toBeUndefined();
    const dgGroups: Group[] = dgi.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(1);
    const phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("phrase");
    expect(dgi.bias).toEqual(2.0);
});

test("Grammar updates post call", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    dgBuilder.addPhrase("phrase");

    let ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    let retObj: ServiceSpeechContext = JSON.parse(ret) as ServiceSpeechContext;
    expect(retObj).not.toBeUndefined();

    let dgi: Dgi = retObj.dgi;
    expect(dgi).not.toBeUndefined();
    expect(dgi).not.toBeUndefined();
    expect(dgi.groups).not.toBeUndefined();
    let dgGroups: Group[] = dgi.groups;
    expect(dgGroups.length).toEqual(1);
    let group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(1);
    let phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("phrase");

    dgBuilder.clearPhrases();
    dgBuilder.addPhrase("newPhrase");

    ret = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    retObj = JSON.parse(ret) as ServiceSpeechContext;
    expect(retObj).not.toBeUndefined();

    dgi = retObj.dgi;
    expect(dgi).not.toBeUndefined();
    expect(dgi).not.toBeUndefined();
    expect(dgi.groups).not.toBeUndefined();
    dgGroups = dgi.groups;
    expect(dgGroups.length).toEqual(1);
    group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(1);
    phrase = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("newPhrase");
});

test("Model name only, no options", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    speechContext.setModel("my-custom-model");

    const retObj: ServiceSpeechContext = JSON.parse(speechContext.toJSON()) as ServiceSpeechContext;
    expect(retObj.model).not.toBeUndefined();
    expect(retObj.model.name).toEqual("my-custom-model");
    expect(retObj.model.options).toBeUndefined();
});

test("Model name and options", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    speechContext.setModel("my-custom-model", JSON.stringify({ foo: "bar", count: 3 }));

    const retObj: ServiceSpeechContext = JSON.parse(speechContext.toJSON()) as ServiceSpeechContext;
    expect(retObj.model).not.toBeUndefined();
    expect(retObj.model.name).toEqual("my-custom-model");
    expect(retObj.model.options).toEqual({ foo: "bar", count: 3 });
});

test("Model block omitted when no name", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    speechContext.setModel("");
    speechContext.setModel(undefined, JSON.stringify({ foo: "bar" }));

    const retObj: ServiceSpeechContext = JSON.parse(speechContext.toJSON()) as ServiceSpeechContext;
    expect(retObj.model).toBeUndefined();
});

test("Model name with special characters is escaped", (): void => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    // Name containing characters that would break JSON if not escaped:
    // double quote, backslash, newline, and tab.
    const nastyName: string = "ev\"il\\name\n\tend";
    speechContext.setModel(nastyName);

    const raw: string = speechContext.toJSON();

    // The raw serialized JSON must contain the escaped forms, not the literal characters.
    expect(raw).toContain("\\\"");   // "  ->  \"
    expect(raw).toContain("\\\\");   // \  ->  \\
    expect(raw).toContain("\\n");    // newline -> \n
    expect(raw).toContain("\\t");    // tab -> \t

    // And it must still be valid JSON that round-trips back to the exact input.
    const retObj: ServiceSpeechContext = JSON.parse(raw) as ServiceSpeechContext;
    expect(retObj.model).not.toBeUndefined();
    expect(retObj.model.name).toEqual(nastyName);
});
