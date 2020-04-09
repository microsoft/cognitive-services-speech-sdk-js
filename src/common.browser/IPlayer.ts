// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IPlayer {
    pause(): void;
    resume(): void;
    onAudioEnd: (sender: IPlayer) => void;
    currentTime: number;
}
