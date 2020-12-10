// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { Settings } from "./Settings";

export class WaveFileAudioInput {

    public static getAudioConfigFromFile(filename: string): sdk.AudioConfig {
        if (typeof File === "undefined") {
            let pushStream: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
            if (filename === Settings.WaveFile44k) {
                const f: sdk.AudioStreamFormat = sdk.AudioStreamFormat.getWaveFormatPCM(44100, 16, 1);
                pushStream = sdk.AudioInputStream.createPushStream(f);
            } else {
                pushStream = sdk.AudioInputStream.createPushStream();
            }
            fs.createReadStream(filename).on("data", (arrayBuffer: Buffer): void => {
                pushStream.write(arrayBuffer.slice());
            }).on("end", (): void => {
                pushStream.close();
            });
            return sdk.AudioConfig.fromStreamInput(pushStream);
        } else {
            const f: File = WaveFileAudioInput.LoadFile(filename);
            return sdk.AudioConfig.fromWavFileInput(f);
        }
    }

    public static LoadFile(filename: string): File {
        // obtain and open the line.
        const fileContents: Buffer = fs.readFileSync(filename);

        const arrayBuffer: ArrayBuffer = Uint8Array.from(fileContents).buffer;
        const parts: ArrayBuffer[] = [arrayBuffer];
        const file: File = new File(parts, filename);

        return (file);
    }

    public static LoadArrayFromFile(filename: string): ArrayBuffer {
        const fileContents: Buffer = fs.readFileSync(filename);

        const ret = Uint8Array.from(fileContents.slice(44));

        return ret.buffer;
    }
}
