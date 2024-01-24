// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InvalidOperationError } from "../common/Error.js";
import { DialogServiceTurnState } from "./DialogServiceTurnState.js";

export class DialogServiceTurnStateManager {
    private privTurnMap: Map<string, DialogServiceTurnState>;

    public constructor() {
        this.privTurnMap = new Map<string, DialogServiceTurnState>();
        return;
    }

    public StartTurn(id: string): DialogServiceTurnState {
        if (this.privTurnMap.has(id)) {
            throw new InvalidOperationError("Service error: There is already a turn with id:" + id);
        }
        const turnState: DialogServiceTurnState = new DialogServiceTurnState(this, id);
        this.privTurnMap.set(id, turnState);
        return this.privTurnMap.get(id);
    }

    public GetTurn(id: string): DialogServiceTurnState {
        return this.privTurnMap.get(id);
    }

    public CompleteTurn(id: string): DialogServiceTurnState {
        if (!this.privTurnMap.has(id)) {
            throw new InvalidOperationError("Service error: Received turn end for an unknown turn id:" + id);
        }
        const turnState = this.privTurnMap.get(id);
        turnState.complete();
        this.privTurnMap.delete(id);
        return turnState;
    }
}
