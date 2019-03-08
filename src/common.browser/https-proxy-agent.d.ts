// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// The https-proxy-agent doesn't export a type definiton file.
// So create one.

declare module "https-proxy-agent" {
    import * as https from "https";

    namespace HttpsProxyAgent {
        interface IHttpsProxyAgentOptions {
            host: string;
            port: number;
            secureProxy?: boolean;
            headers?: {
                [key: string]: string;
            };
            [key: string]: any;
        }
    }

    class HttpsProxyAgent extends https.Agent {
        constructor(opts: HttpsProxyAgent.IHttpsProxyAgentOptions)
    }

    export = HttpsProxyAgent;
}
