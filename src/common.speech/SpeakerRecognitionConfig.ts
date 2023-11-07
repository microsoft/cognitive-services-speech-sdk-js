// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection } from "../sdk/Exports.js";
import { Context } from "./Exports.js";

export class SpeakerRecognitionConfig {
    private privParameters: PropertyCollection;
    private privContext: Context;

    public constructor(
        context: Context,
        parameters: PropertyCollection) {
        this.privContext = context ? context : new Context(null);
        this.privParameters = parameters;
    }

    public get parameters(): PropertyCollection {
        return this.privParameters;
    }

    public get Context(): Context {
        return this.privContext;
    }
}
