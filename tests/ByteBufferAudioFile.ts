// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class ByteBufferAudioFile {
    public static Load(buffers: ArrayBuffer[]): File {

        const file: File = new File(buffers, "file.wav");

        return file;
    }
}
