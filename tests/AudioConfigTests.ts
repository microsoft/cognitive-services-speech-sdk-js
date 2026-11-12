// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioConfig, AudioConfigImpl } from "../src/sdk/Audio/AudioConfig";
import { AudioInputStream } from "../src/sdk/Audio/AudioInputStream";
import { PullAudioInputStreamCallback } from "../src/sdk/Audio/PullAudioInputStreamCallback";

class EmptyPullCallback extends PullAudioInputStreamCallback {
    public read(dataBuffer: ArrayBuffer): number {
        return 0;
    }

    public close(): void {
        return;
    }
}

const sources = [
    { name: "push stream", create: () => AudioInputStream.createPushStream() },
    { name: "pull stream", create: () => AudioInputStream.createPullStream(new EmptyPullCallback()) },
    { name: "pull callback", create: () => new EmptyPullCallback() },
];

for (const source of sources) {
    test(`AudioConfig.close accepts a ${source.name} without callbacks`, () => {
        const audio = AudioConfig.fromStreamInput(source.create()) as AudioConfigImpl;
        expect(() => audio.close()).not.toThrow();
    });

    test(`AudioConfig.close completes for a ${source.name}`, async () => {
        const audio = AudioConfig.fromStreamInput(source.create()) as AudioConfigImpl;
        const onClose = jest.fn();
        const onError = jest.fn();
        await new Promise<void>((resolve, reject) => {
            audio.close(() => {
                onClose();
                resolve();
            }, (error: string) => {
                onError(error);
                reject(new Error(error));
            });
        });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });
}
