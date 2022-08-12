// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    OutputFormatPropertyName,
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

        this.setCommonResultFormatOptions(config, queryParams);

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

    private setCommonResultFormatOptions(
        config: RecognizerConfig,
        queryParams: IStringDictionary<string>) : void {

        // Ensure we explicitly set the output format according to the config property *before* evaluating implicit
        // ways it may be set
        const outputFormatFromProperty = config.parameters.getProperty(OutputFormatPropertyName, undefined);
        if (outputFormatFromProperty !== undefined) {
            queryParams[QueryParameterNames.Format] = outputFormatFromProperty.toLowerCase();
        }

        // Handle the implicit relationship between output format and word-level timestamps:
        //  - If format is "detailed" and no explicit value was provided for word-level timestamps, enable timestamps
        //  - If format *isn't* "detailed" and word-level timestamps were specifically requested, enable detailed
        //      output format. This will override even explicit "simple" format!
        if (queryParams[QueryParameterNames.Format] === "detailed") {
            if (!(QueryParameterNames.EnableWordLevelTimestamps in queryParams)) {
                queryParams[QueryParameterNames.EnableWordLevelTimestamps] = "true";
            }
        } else if (queryParams[QueryParameterNames.EnableWordLevelTimestamps] === "true") {
            queryParams[QueryParameterNames.Format] = "detailed";
        }

        // Synchronize enablement of word-level confidence scores to enablement of word-level timestamps:
        //  - If word-level timestamps are on/off, set word-level confidence to on/off
        if (QueryParameterNames.EnableWordLevelTimestamps in queryParams && !(QueryParameterNames.EnableWordLevelConfidence in queryParams)) {
            queryParams[QueryParameterNames.EnableWordLevelConfidence] = queryParams[QueryParameterNames.EnableWordLevelTimestamps];
        }
    }
}
