// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ChildProcess, exec, execFile } from "child_process";
import { IStringDictionary } from "../../src/common/Exports";
import path from "path";

/**
 * A test server to be used for writing integration or unit tests. This provides endpoints that can
 * echo back received requests/messages, trigger specific closures. It also provides a web socket
 * proxy endpoint that acts as an intermediary between you and a real web socket service. That allows
 * you to modify/inject/close/etc... live messages
 */
export class TestServer {
    private _host: string = "localhost";
    private _port: number;
    private _process: ChildProcess;

    /**
     * Creates and starts a new test server process
     * @returns The TestServer instance
     */
    public static async startAsync(): Promise<TestServer> {
        const server = new TestServer();
        await server.startAsync();
        return server;
    }

    /**
     * Closes the test server
     */
    public close(): void {
        if (this._process) {
            this._process.kill();
        }
    }

    /** Gets the host name of the test server */
    public get host(): string { return this._host; }

    /**  the port the test server is listening on */
    public get port(): number { return this._port; }

    /** Gets the HTTP endpoint the test server is listening on (e.g. http://localhost:43124) */
    public get httpEndpoint(): string {
        return `http://${this._host}:${this._port}`;
    }

    /** Gets the web socket endpoint the test server is listening on (e.g. ws://localhost:43124) */
    public get wsEndpoint(): string {
        return `ws://${this._host}:${this._port}`;
    }

    /**
     * Gets the full URL to the web socket endpoint that echoes back all received messages
     * @returns Full URL
     */
    public getWsEchoEndpoint(): string {
        return `${this.wsEndpoint}/ws/echo`;
    }

    /**
     * Gets a web socket endpoint that will close the connection after a specified number of messages.
     * For each message received, the web socket endpoint will return back the count of messages so far.
     * @param status The web socket status code to use when closing the web socket connection
     * @param reason The reason to return for closing the web socket connection
     * @param after How many messages to receive before the web socket is closed. Default is 0
     * @returns Full URL
     */
    public getWsCloseEndpoint(status: number, reason: string, after: number = 0): string {
        let queryString = TestServer.generateQueryString({
            "status": status.toString(),
            "reason": reason,
            after: after.toString()
        });

        return `${this.wsEndpoint}/ws/close${queryString}`;
    }

    /**
     * Gets the full URL to the web socket endpoint that acts as an intermediary between another
     * upstream web socket server. This allows you to send specific commands to e.g. delay messages, 
     * modify messages, trigger web socket closures, etc...
     * @param url The full upstream URL to connect to including the path and query string
     * @param subProtocol (Optional) The web socket sub protocol to use when connecting to
     * the upstream URL
     * @param proxyHost (Optional) The proxy to use when connecting to the upstream URL.
     * Both host and port must be specified for the proxy to be used
     * @param proxyPort (Optional) The proxy port to use when connecting to the upstream URL.
     * Both host and port must be specified for the proxy to be used
     * @returns Full URL
     */
    public getWsProxyEndpoint(url: string, subProtocol?: string, proxyHost?: string, proxyPort?: number): string {
        let query: IStringDictionary<string> = {
            "x-proxy-uri": url,
            "x-proxy-sub-protocol": subProtocol
        };

        if (proxyHost != null && proxyPort != null) {
            query["x-proxy-proxy"] = `${proxyHost}:${proxyPort}`;
        }

        let queryString = TestServer.generateQueryString(query);
        return `${this.wsEndpoint}/ws/proxy${queryString}`;
    }

    /**
     * Gets the text message prefix to use when sending commands to the web socket proxy endpoint
     * when not in USP mode
     */
    public get commandPrefix(): string { return `<<!!${this.commandPath}!!>>` };

    /**
     * Gets the path of the USP text message to set when sending commands to the web socket proxy
     * endpoint
     */
    public get commandPath(): string { return "templeton"; }

    /**
     * Gets the command to send to the proxy web socket endpoint to force close the web socket at
     * the TCP level (simulates network failure). There will be no close handshake and no close
     * frame sent to the client
     * @param delayInMs (Optional) The delay in milliseconds to wait before force closing the web
     * socket connection
     * @returns The JSON text message to send to the web socket proxy endpoint
     */
    public getAbortCommand(delayInMs: number = 0): string {
        return JSON.stringify({
            command: "AbortConnection",
            delay: delayInMs
        });
    }

    /**
     * Gets the command to send to the proxy web socket endpoint to close the web socket using
     * the specified status code and reason. A close handshake will be performed and a close frame
     * will be sent to the client
     * @param status The web socket status code to use when closing the web socket connection
     * @param reason The reason that the web socket connection is closing
     * @param delayInMs (Optional) The delay in milliseconds to wait before closing the web
     * socket connection
     * @returns The JSON text message to send to the web socket proxy endpoint
     */
    public getDisconnectCommand(status: number = 1000, reason: string = "OK", delayInMs: number = 0): string {
        return JSON.stringify({
            command: "CloseConnection",
            delay: delayInMs,
            ClientCloseStatus: status,
            ClientCloseReason: reason
        });
    }

    private constructor() {
    }

    private startAsync(): Promise<void> {
        if (typeof exec !== "function") {
            const err = "Test server is only supported when running in Node.js (exec is not available)";
            pending(err);
            return Promise.reject(err);
        }

        return new Promise<void>((resolve, reject) => {
            const maxLines = 50;
            let lines = 0;
            let havePort = false;

            const dir = path.join(__dirname, "..", "input", "test_server");

            this._process = exec(
                 "dotnet exec test_server.dll",
                {
                    cwd: dir,
                    windowsHide: true,
                },
                (error, _, stderr) => {
                    if (error) {
                        reject(`Failed to launch test server process. Error: ${error.message}. Stderr: ${stderr}`);
                    }

                    if (!havePort) {
                        reject("Failed to parse port number from test server output");
                    }
                });
            
            this._process.stdout.on("data", (data) => {
                if (!havePort && typeof data === "string") {
                    const portString = "listening at: http://localhost:";
                    let index = (<string>data).indexOf("listening at: http://localhost:");

                    if (index >= 0) {
                        havePort = true;

                        const port = parseInt(data.substring(index + portString.length).trim());
                        if (isNaN(port)) {    
                            reject(`Failed to parse port number from test server output: ${data}`);
                        } else {
                            this._port = port;
                            resolve();
                        }
                    }
                }

                if (!havePort && ++lines > maxLines) {
                    reject("Failed to parse port number from test server output");
                }

                // eslint-disable-next-line no-console
                console.info(data);
            });

            this._process.stderr.on("data", (data) => {
                // eslint-disable-next-line no-console
                console.error(data);
            });
        });
    }

    private static generateQueryString(args: IStringDictionary<string>): string {
        let queryString = "";

        for (const key in args) {
            let value = args[key];
            if (key == null || value === undefined) continue;

            queryString += queryString.length === 0 ? "?" : "&";
            queryString += encodeURIComponent(key);

            if (value !== null) {
                queryString += "=";
                queryString += encodeURIComponent(value);
            }
        }

        return queryString;
    }
};