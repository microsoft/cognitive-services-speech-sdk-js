// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ServicePropertiesPropertyName,
} from "../common.speech/Exports";
import { IConnection, IStringDictionary } from "../common/Exports";
import { PropertyId } from "../sdk/Exports";
import { AuthInfo, IConnectionFactory, RecognizerConfig } from "./Exports";
import { QueryParameterNames } from "./QueryParameterNames";

export abstract class ConnectionFactoryBase implements IConnectionFactory {

    public static getHostSuffix(region: string): string {
        if (!!region) {
            if (region.toLowerCase().startsWith("china")) {
                return ".azure.cn";
            }
            if (region.toLowerCase().startsWith("usgov")) {
                return ".azure.us";
            }
        }
        return ".microsoft.com";
    }

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
            QueryParameterNames.Profanity,
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

        const serviceProperties: IStringDictionary<string> = JSON.parse(config.parameters.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;

        Object.keys(serviceProperties).forEach((value: string): void => {
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
