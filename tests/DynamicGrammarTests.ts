// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
    IDynamicGrammar,
    IDynamicGrammarGeneric,
    IDynamicGrammarGroup,
} from "../src/common.speech/Exports";
import { Settings } from "./Settings";


beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

// eslint-disable-next-line no-console
beforeEach(() => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

jest.retryTimes(Settings.RetryCount);

test("Empty Grammar, empty output.", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();

    const ret: object = dgi.generateGrammarObject();
    expect(ret).toBeUndefined();
});

test("Single RefGrammar", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Singlegrammar");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.ReferenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.ReferenceGrammars;
    expect(refGrammars.length).toEqual(1);
    expect(refGrammars[0]).toEqual("Singlegrammar");
});

test("Single RefGrammar, twice", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Singlegrammar");
    dgi.addReferenceGrammar("Anothergrammar");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.ReferenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.ReferenceGrammars;
    expect(refGrammars.length).toEqual(2);
    expect(refGrammars[0]).toEqual("Singlegrammar");
    expect(refGrammars[1]).toEqual("Anothergrammar");
});

test("Multiple RefGrammar", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.ReferenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.ReferenceGrammars;
    expect(refGrammars.length).toEqual(2);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
});

test("Multiple RefGrammar Twice", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);
    dgi.addReferenceGrammar(["Thirdgrammar", "Fourthgrammar"]);

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.ReferenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.ReferenceGrammars;
    expect(refGrammars.length).toEqual(4);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
    expect(refGrammars[2]).toEqual("Thirdgrammar");
    expect(refGrammars[3]).toEqual("Fourthgrammar");
});

test("Mix Multiple/Single RefGrammar", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);
    dgi.addReferenceGrammar("Thirdgrammar");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.ReferenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.ReferenceGrammars;
    expect(refGrammars.length).toEqual(3);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
    expect(refGrammars[2]).toEqual("Thirdgrammar");
});

test("Single Phrase", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("Singlephrase");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = ret.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(1);
    const phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Singlephrase");
});

test("Single Phrase, twice", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("Singlephrase");
    dgi.addPhrase("Anotherphrase");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = ret.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(2);
    let phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Singlephrase");
    phrase = group.Items[1] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Anotherphrase");
});

test("Multiple Phrase", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = ret.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(2);
    let phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Firstphrase");
    phrase = group.Items[1] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Secondphrase");
});

test("Multiple Phrase Twice", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);
    dgi.addPhrase(["Thirdphrase", "Fourthphrase"]);

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = ret.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(4);
    let phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Firstphrase");
    phrase = group.Items[1] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Secondphrase");
    phrase = group.Items[2] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Thirdphrase");
    phrase = group.Items[3] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Fourthphrase");

});

test("Mix Multiple/Single Phrase", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);
    dgi.addPhrase("Thirdphrase");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = ret.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(3);
    let phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Firstphrase");
    phrase = group.Items[1] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Secondphrase");
    phrase = group.Items[2] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Thirdphrase");
});

test("Phrase and Grammars", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);
    dgi.addReferenceGrammar("Thirdgrammar");
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);
    dgi.addPhrase("Thirdphrase");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.ReferenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.ReferenceGrammars;
    expect(refGrammars.length).toEqual(3);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
    expect(refGrammars[2]).toEqual("Thirdgrammar");

    expect(ret.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = ret.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(3);
    let phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Firstphrase");
    phrase = group.Items[1] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Secondphrase");
    phrase = group.Items[2] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Thirdphrase");
});

test("Clearing RefGrammars does", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Singlegrammar");
    dgi.clearGrammars();

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).toBeUndefined();
});

test("Clearing Phrases does", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("Singlegrammar");
    dgi.clearPhrases();

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).toBeUndefined();
});

test("Add / clear / add Phrase", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("first Phrase");
    dgi.clearPhrases();
    dgi.addPhrase("Singlephrase");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.Groups).not.toBeUndefined();
    const dgGroups: IDynamicGrammarGroup[] = ret.Groups;
    expect(dgGroups.length).toEqual(1);
    const group: IDynamicGrammarGroup = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.Type).toEqual("Generic");
    expect(group.Items).not.toBeUndefined();
    expect(group.Items.length).toEqual(1);
    const phrase: IDynamicGrammarGeneric = group.Items[0] as IDynamicGrammarGeneric;
    expect(phrase).not.toBeUndefined();
    expect(phrase.Text).toEqual("Singlephrase");
});

test("Add / clear / add RefGrammar", () => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Grammar");
    dgi.clearGrammars();
    dgi.addReferenceGrammar("Singlegrammar");

    const ret: IDynamicGrammar = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.ReferenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.ReferenceGrammars;
    expect(refGrammars.length).toEqual(1);
    expect(refGrammars[0]).toEqual("Singlegrammar");
});
