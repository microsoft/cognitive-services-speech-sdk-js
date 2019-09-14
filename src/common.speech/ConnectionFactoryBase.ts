// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ServicePropertiesPropertyName,
} from "../common.speech/Exports";
import { IConnection, IStringDictionary } from "../common/Exports";
import { OutputFormat, PropertyId } from "../sdk/Exports";
import { AuthInfo, IConnectionFactory, RecognitionMode, RecognizerConfig, WebsocketMessageFormatter } from "./Exports";
import { QueryParameterNames } from "./QueryParameterNames";

export abstract class ConnectionFactoryBase implements IConnectionFactory {
    public abstract create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection;

    protected setCommonUrlParams(
        config: RecognizerConfig,
        queryParams: IStringDictionary<string>,
        endpoint: string): void {

        this.setUrlParameter(PropertyId.SpeechServiceConnection_EnableAudioLogging,
            QueryParameterNames.EnableAudioLogging,
            config,
            queryParams,
            endpoint);

        this.setUrlParameter(PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps,
            QueryParameterNames.EnableWordLevelTimestamps,
            config,
            queryParams,
            endpoint);

        this.setUrlParameter(PropertyId.SpeechServiceResponse_ProfanityOption,
            QueryParameterNames.Profanify,
            config,
            queryParams,
            endpoint);

        this.setUrlParameter(PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
            QueryParameterNames.InitialSilenceTimeoutMs,
            config,
            queryParams,
            endpoint);

        this.setUrlParameter(PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
            QueryParameterNames.EndSilenceTimeoutMs,
            config,
            queryParams,
            endpoint);

        this.setUrlParameter(PropertyId.SpeechServiceResponse_StablePartialResultThreshold,
            QueryParameterNames.StableIntermediateThreshold,
            config,
            queryParams,
            endpoint);

        const serviceProperties: IStringDictionary<string> = JSON.parse(config.parameters.getProperty(ServicePropertiesPropertyName, "{}"));

        Object.keys(serviceProperties).forEach((value: string, num: number, array: string[]) => {
            queryParams[value] = serviceProperties[value];
        });
    }

    protected setUrlParameter(
        propId: PropertyId,
        parameterName: string,
        config: RecognizerConfig,
        queryParams: IStringDictionary<string>,
        endpoint: string): void {

        const value: string = config.parameters.getProperty(propId, undefined);

        if (value && (!endpoint || endpoint.search(parameterName) === -1)) {
            queryParams[parameterName] = value.toLocaleLowerCase();
        }
    }
}
