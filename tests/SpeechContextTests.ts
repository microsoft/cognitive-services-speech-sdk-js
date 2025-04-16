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
