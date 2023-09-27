// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { CognitiveSubscriptionKeyAuthentication, CognitiveTokenAuthentication, Context, IAuthentication, ISynthesisConnectionFactory, OS, SpeechServiceConfig, SynthesisAdapterBase, SynthesisRestAdapter, SynthesizerConfig } from "../common.speech/Exports";
import { Contracts } from "./Contracts";
import { PropertyCollection, PropertyId, SpeechConfig, SpeechConfigImpl } from "./Exports";

export abstract class Synthesizer {
    protected privAdapter: SynthesisAdapterBase;
    protected privRestAdapter: SynthesisRestAdapter;
    protected privProperties: PropertyCollection;
    protected privConnectionFactory: ISynthesisConnectionFactory;

    /**
     * Creates and initializes an instance of a Recognizer
     * @constructor
     * @param {SpeechConfig} speechConfig - The speech config to initialize the synthesizer.
     */
    protected constructor(speechConfig: SpeechConfig) {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNull(speechConfigImpl, "speechConfig");

        this.privProperties = speechConfigImpl.properties.clone();
    }

    //
    // ################################################################################################################
    // IMPLEMENTATION.
    // Move to independent class
    // ################################################################################################################
    //

    // Creates the synthesis adapter
    protected abstract createSynthesisAdapter(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig): SynthesisAdapterBase;

    protected abstract createRestSynthesisAdapter(
        authentication: IAuthentication,
        synthesizerConfig: SynthesizerConfig): SynthesisRestAdapter;

    protected createSynthesizerConfig(speechConfig: SpeechServiceConfig): SynthesizerConfig {
        return new SynthesizerConfig(
            speechConfig,
            this.privProperties);
    }

    // Does the generic synthesizer setup that is common across all synthesizer types.
    protected implCommonSynthesizeSetup(): void {

        let osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        let osName = "unknown";
        let osVersion = "unknown";

        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }

        const synthesizerConfig: SynthesizerConfig = this.createSynthesizerConfig(
            new SpeechServiceConfig(
                new Context(new OS(osPlatform, osName, osVersion))));

        const subscriptionKey = this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);
        const authentication = (subscriptionKey && subscriptionKey !== "") ?
            new CognitiveSubscriptionKeyAuthentication(subscriptionKey) :
            new CognitiveTokenAuthentication(
                (): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                },
                (): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                });

        this.privAdapter = this.createSynthesisAdapter(
            authentication,
            this.privConnectionFactory,
            synthesizerConfig);

        this.privRestAdapter = this.createRestSynthesisAdapter(
            authentication,
            synthesizerConfig);
    }
}
