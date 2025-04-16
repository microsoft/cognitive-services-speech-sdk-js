// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder
} from "../src/common.speech/Exports";
import { Dgi } from "../src/common.speech/ServiceMessages/Dgi/Dgi";
import { Group } from "../src/common.speech/ServiceMessages/Dgi/Group";
import { Item } from "../src/common.speech/ServiceMessages/Dgi/Item";
import { Settings } from "./Settings";


beforeAll((): void => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

// eslint-disable-next-line no-console
beforeEach((): void => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

jest.retryTimes(Settings.RetryCount);

test("Empty Grammar, empty output.", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();

    const ret: object = dgi.generateGrammarObject();
    expect(ret).toBeUndefined();
});

test("Single RefGrammar", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Singlegrammar");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.referenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.referenceGrammars;
    expect(refGrammars.length).toEqual(1);
    expect(refGrammars[0]).toEqual("Singlegrammar");
});

test("Single RefGrammar, twice", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Singlegrammar");
    dgi.addReferenceGrammar("Anothergrammar");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.referenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.referenceGrammars;
    expect(refGrammars.length).toEqual(2);
    expect(refGrammars[0]).toEqual("Singlegrammar");
    expect(refGrammars[1]).toEqual("Anothergrammar");
});

test("Multiple RefGrammar", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.referenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.referenceGrammars;
    expect(refGrammars.length).toEqual(2);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
});

test("Multiple RefGrammar Twice", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);
    dgi.addReferenceGrammar(["Thirdgrammar", "Fourthgrammar"]);

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.referenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.referenceGrammars;
    expect(refGrammars.length).toEqual(4);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
    expect(refGrammars[2]).toEqual("Thirdgrammar");
    expect(refGrammars[3]).toEqual("Fourthgrammar");
});

test("Mix Multiple/Single RefGrammar", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);
    dgi.addReferenceGrammar("Thirdgrammar");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.referenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.referenceGrammars;
    expect(refGrammars.length).toEqual(3);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
    expect(refGrammars[2]).toEqual("Thirdgrammar");
});

test("Single Phrase", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("Singlephrase");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.groups).not.toBeUndefined();
    const dgGroups: Group[] = ret.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(1);
    const phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Singlephrase");
});

test("Single Phrase, twice", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("Singlephrase");
    dgi.addPhrase("Anotherphrase");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.groups).not.toBeUndefined();
    const dgGroups: Group[] = ret.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(2);
    let phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Singlephrase");
    phrase = group.items[1];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Anotherphrase");
});

test("Multiple Phrase", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.groups).not.toBeUndefined();
    const dgGroups: Group[] = ret.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(2);
    let phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Firstphrase");
    phrase = group.items[1];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Secondphrase");
});

test("Multiple Phrase Twice", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);
    dgi.addPhrase(["Thirdphrase", "Fourthphrase"]);

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.groups).not.toBeUndefined();
    const dgGroups: Group[] = ret.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(4);
    let phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Firstphrase");
    phrase = group.items[1];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Secondphrase");
    phrase = group.items[2];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Thirdphrase");
    phrase = group.items[3];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Fourthphrase");

});

test("Mix Multiple/Single Phrase", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);
    dgi.addPhrase("Thirdphrase");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.groups).not.toBeUndefined();
    const dgGroups: Group[] = ret.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(3);
    let phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Firstphrase");
    phrase = group.items[1];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Secondphrase");
    phrase = group.items[2];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Thirdphrase");
});

test("Phrase and Grammars", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar(["Firstgrammar", "Secondgrammar"]);
    dgi.addReferenceGrammar("Thirdgrammar");
    dgi.addPhrase(["Firstphrase", "Secondphrase"]);
    dgi.addPhrase("Thirdphrase");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.referenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.referenceGrammars;
    expect(refGrammars.length).toEqual(3);
    expect(refGrammars[0]).toEqual("Firstgrammar");
    expect(refGrammars[1]).toEqual("Secondgrammar");
    expect(refGrammars[2]).toEqual("Thirdgrammar");

    expect(ret.groups).not.toBeUndefined();
    const dgGroups: Group[] = ret.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(3);
    let phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Firstphrase");
    phrase = group.items[1];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Secondphrase");
    phrase = group.items[2];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Thirdphrase");
});

test("Clearing RefGrammars does", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Singlegrammar");
    dgi.clearGrammars();

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).toBeUndefined();
});

test("Clearing Phrases does", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("Singlegrammar");
    dgi.clearPhrases();

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).toBeUndefined();
});

test("Add / clear / add Phrase", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addPhrase("first Phrase");
    dgi.clearPhrases();
    dgi.addPhrase("Singlephrase");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.groups).not.toBeUndefined();
    const dgGroups: Group[] = ret.groups;
    expect(dgGroups.length).toEqual(1);
    const group: Group = dgGroups[0];
    expect(group).not.toBeUndefined();
    expect(group.type).toEqual("Generic");
    expect(group.items).not.toBeUndefined();
    expect(group.items.length).toEqual(1);
    const phrase: Item = group.items[0];
    expect(phrase).not.toBeUndefined();
    expect(phrase.text).toEqual("Singlephrase");
});

test("Add / clear / add RefGrammar", (): void => {
    const dgi: DynamicGrammarBuilder = new DynamicGrammarBuilder();
    dgi.addReferenceGrammar("Grammar");
    dgi.clearGrammars();
    dgi.addReferenceGrammar("Singlegrammar");

    const ret: Dgi = dgi.generateGrammarObject();
    expect(ret).not.toBeUndefined();
    expect(ret.referenceGrammars).not.toBeUndefined();
    const refGrammars: string[] = ret.referenceGrammars;
    expect(refGrammars.length).toEqual(1);
    expect(refGrammars[0]).toEqual("Singlegrammar");
});
