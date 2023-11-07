// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    createNoDashGuid,
    Deferred,
    IDetachable,
} from "../../common/Exports.js";

/**
 * Placeholder class for the Conversation Request Session. Based off RequestSession.
 * TODO: define what telemetry is required.
 */
export class ConversationRequestSession {
    private privIsDisposed: boolean = false;
    private privDetachables: IDetachable[] = new Array<IDetachable>();
    private privRequestId: string;
    private privRequestCompletionDeferral: Deferred<void>;
    private privSessionId: string;

    public constructor(sessionId: string) {
        this.privSessionId = sessionId;
        this.privRequestId = createNoDashGuid();
        this.privRequestCompletionDeferral = new Deferred<void>();
    }

    public get sessionId(): string {
        return this.privSessionId;
    }

    public get requestId(): string {
        return this.privRequestId;
    }

    public get completionPromise(): Promise<void> {
        return this.privRequestCompletionDeferral.promise;
    }

    public onPreConnectionStart(authFetchEventId: string, connectionId: string): void {
        this.privSessionId = connectionId;
    }

    public onAuthCompleted(isError: boolean): void {
        if (isError) {
            this.onComplete();
        }
    }

    public onConnectionEstablishCompleted(statusCode: number): void {
        if (statusCode === 200) {
            return;
        } else if (statusCode === 403) {
            this.onComplete();
        }
    }

    public onServiceTurnEndResponse(continuousRecognition: boolean): void {
        if (!continuousRecognition) {
            this.onComplete();
        } else {
            this.privRequestId = createNoDashGuid();
        }
    }

    public async dispose(): Promise<void> {
        if (!this.privIsDisposed) {
            // we should have completed by now. If we did not its an unknown error.
            this.privIsDisposed = true;
            for (const detachable of this.privDetachables) {
                await detachable.detach();
            }
        }
    }

    private onComplete(): void {
        //
    }

}
