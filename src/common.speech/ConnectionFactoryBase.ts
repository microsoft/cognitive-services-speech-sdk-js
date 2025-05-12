// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ServicePropertiesPropertyName,
} from "../common.speech/Exports.js";
import { ConnectionRedirectEvent, Events, IConnection, IStringDictionary } from "../common/Exports.js";
import { PropertyId } from "../sdk/Exports.js";
import { AuthInfo, IConnectionFactory, RecognizerConfig } from "./Exports.js";
import { QueryParameterNames } from "./QueryParameterNames.js";

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
        connectionId?: string): Promise<IConnection>;

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

        // FIXME: The .search() check will incorrectly match parameter name anywhere in the string
        //        including e.g. the path portion, or even as a substring of other query parameters
        if (value && (!endpoint || endpoint.search(parameterName) === -1)) {
            queryParams[parameterName] = value.toLocaleLowerCase();
        }
    }

    public static async getRedirectUrlFromEndpoint(endpoint: string): Promise<string> {

        let redirectUrlString: string;

        if (typeof window !== "undefined" && typeof window.fetch !== "undefined") {
            // make a rest call to the endpoint to get the redirect url
            const redirectUrl: URL = new URL(endpoint);
            redirectUrl.protocol = "https:";
            redirectUrl.port = "443";
            const params: URLSearchParams = redirectUrl.searchParams;
            params.append("GenerateRedirectResponse", "true");

            const redirectedUrlString: string = redirectUrl.toString();
            Events.instance.onEvent(new ConnectionRedirectEvent("", redirectedUrlString, undefined, "ConnectionFactoryBase: redirectUrl request"));

            const redirectResponse: Response = await fetch(redirectedUrlString);

            if (redirectResponse.status !== 200) {
                return endpoint;
            }

            // Fix: properly read the response text
            redirectUrlString = await redirectResponse.text();
        } else {
            redirectUrlString = endpoint;
        }

        Events.instance.onEvent(new ConnectionRedirectEvent("", redirectUrlString, endpoint, "ConnectionFactoryBase: redirectUrlString"));

        try {
            // Validate the URL before returning
            return new URL(redirectUrlString.trim()).toString();
        } catch (error) {
            return endpoint; // Return original endpoint if the redirect URL is invalid
        }
    }

}
