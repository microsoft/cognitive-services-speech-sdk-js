// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { v4 as uuid } from "uuid";

const createGuid: () => string = (): string => uuid();

const createNoDashGuid: () => string = (): string => createGuid().replace(new RegExp("-", "g"), "").toUpperCase();

export { createGuid, createNoDashGuid };
