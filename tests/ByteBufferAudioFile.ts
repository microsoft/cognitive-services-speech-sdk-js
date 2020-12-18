// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class ByteBufferAudioFile {
    public static Load(buffers: ArrayBuffer[]): File {
        return new File(buffers, "file.wav");
    }
}
