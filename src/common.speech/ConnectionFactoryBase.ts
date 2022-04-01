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

        const propertyIdToParameterMap: Map<number, string> = new Map([
            [PropertyId.Speech_SegmentationSilenceTimeoutMs, QueryParameterNames.SegmentationSilenceTimeoutMs],
            [PropertyId.SpeechServiceConnection_EnableAudioLogging, QueryParameterNames.EnableAudioLogging],
            [PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, QueryParameterNames.EndSilenceTimeoutMs],
            [PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, QueryParameterNames.InitialSilenceTimeoutMs],
            [PropertyId.SpeechServiceResponse_PostProcessingOption, QueryParameterNames.Postprocessing],
            [PropertyId.SpeechServiceResponse_ProfanityOption, QueryParameterNames.Profanity],
            [PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, QueryParameterNames.EnableWordLevelTimestamps],
            [PropertyId.SpeechServiceResponse_StablePartialResultThreshold, QueryParameterNames.StableIntermediateThreshold],
        ]);

        propertyIdToParameterMap.forEach((parameterName: string, propertyId: PropertyId): void => {
            this.setUrlParameter(propertyId, parameterName, config, queryParams, endpoint);
        });


        if (queryParams[QueryParameterNames.Format].toLowerCase() === "detailed") {
            // If not otherwise specified, automatically enable word-level timestamps for detailed results
            if (!(QueryParameterNames.EnableWordLevelTimestamps in queryParams)) {
                queryParams[QueryParameterNames.EnableWordLevelTimestamps] = "true";
            }

            // Match enablement/disablement of word-level confidence to enablement/disablement of word-level timestamps
            queryParams[QueryParameterNames.EnableWordLevelConfidence] = queryParams[QueryParameterNames.EnableWordLevelTimestamps];
        }

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
