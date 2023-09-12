// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* webpackChunkName: 'script_processor_audioWorklet' */
// eslint-disable-next-line @typescript-eslint/tslint/config
export const getAudioWorkerUrl = (): string => new URL("speech-processor.js", import.meta.url).toString();
