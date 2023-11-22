// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
    IDynamicGrammar,
    IDynamicGrammarGeneric,
    IDynamicGrammarGroup,
    SpeechContext,
} from "../src/common.speech/Exports";
import { Settings } from "./Settings";


beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

// eslint-disable-next-line no-console
beforeEach(() => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

test("Emtpy returns empty", () => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    const ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    const retObj = JSON.parse(ret);
    expect(Object.keys(retObj).length).toEqual(0);
});

test("Random section returned", () => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    speechContext.setSection("test", "testvalue");

    const ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    const retObj = JSON.parse(ret);
    expect(retObj.test).toEqual("testvalue");
});

test("Grammar updates", () => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    dgBuilder.addPhrase("phrase");

    const ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    const retObj = JSON.parse(ret);
    expect(retObj).not.toBeUndefined();

    const dgi: IDynamicGrammar = retObj.dgi as IDynamicGrammar;
    expect(dgi).not.toBeUndefined();
    expect(dgi).not.toBeUndefined();
    expect(dgi.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = dgi.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(1);
    const phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("phrase");
});

test("Grammar updates post call", () => {
    const dgBuilder: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    const speechContext: SpeechContext = new SpeechContext(dgBuilder);

    dgBuilder.addPhrase("phrase");

    let ret: string = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    let retObj = JSON.parse(ret);
    expect(retObj).not.toBeUndefined();

    let dgi: IDynamicGrammar = retObj.dgi as IDynamicGrammar;
    expect(dgi).not.toBeUndefined();
    expect(dgi).not.toBeUndefined();
    expect(dgi.Groups).not.toBeUndefined();
    let dgGroups: IDynamicGrammarGroup[] = dgi.Groups;
    expect(dgGroups.length).toEqual(1);
    let group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(1);
    let phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("phrase");

    dgBuilder.clearPhrases();
    dgBuilder.addPhrase("newPhrase");

    ret = speechContext.toJSON();
    expect(ret).not.toBeUndefined();

    retObj = JSON.parse(ret);
    expect(retObj).not.toBeUndefined();

    dgi = retObj.dgi as IDynamicGrammar;
    expect(dgi).not.toBeUndefined();
    expect(dgi).not.toBeUndefined();
    expect(dgi.Groups).not.toBeUndefined();
    dgGroups = dgi.Groups;
    expect(dgGroups.length).toEqual(1);
    group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(1);
    phrase = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("newPhrase");
});
