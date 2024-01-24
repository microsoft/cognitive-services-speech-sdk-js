// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAudioDestination } from "../common/Exports.js";
import {
    ResultReason,
    SpeechSynthesisBookmarkEventArgs,
    SpeechSynthesisEventArgs,
    SpeechSynthesisResult,
    SpeechSynthesisVisemeEventArgs,
    SpeechSynthesisWordBoundaryEventArgs,
    SpeechSynthesizer,
    Synthesizer,
} from "../sdk/Exports.js";
import {
    IAuthentication,
    ISynthesisConnectionFactory,
    SynthesisAdapterBase,
    SynthesizerConfig
} from "./Exports.js";

export class SpeechSynthesisAdapter extends SynthesisAdapterBase {
    private privSpeechSynthesizer: SpeechSynthesizer;
    public constructor(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig,
        speechSynthesizer: SpeechSynthesizer,
        audioDestination: IAudioDestination) {
            super(authentication, connectionFactory, synthesizerConfig, audioDestination);
            this.privSpeechSynthesizer = speechSynthesizer;
            this.privSynthesizer = speechSynthesizer as Synthesizer;
        }

    protected setSynthesisContextSynthesisSection(): void {
        this.privSynthesisContext.setSynthesisSection(this.privSpeechSynthesizer);
    }

    protected onSynthesisStarted(requestId: string): void {
        const synthesisStartEventArgs: SpeechSynthesisEventArgs = new SpeechSynthesisEventArgs(
            new SpeechSynthesisResult(
                requestId,
                ResultReason.SynthesizingAudioStarted,
            )
        );

        if (!!this.privSpeechSynthesizer.synthesisStarted) {
            this.privSpeechSynthesizer.synthesisStarted(this.privSpeechSynthesizer, synthesisStartEventArgs);
        }
    }

    protected onSynthesizing(audio: ArrayBuffer): void {
        if (!!this.privSpeechSynthesizer.synthesizing) {
            try {
                const audioWithHeader = this.privSynthesisTurn.audioOutputFormat.addHeader(audio);
                const ev: SpeechSynthesisEventArgs = new SpeechSynthesisEventArgs(
                    new SpeechSynthesisResult(
                        this.privSynthesisTurn.requestId,
                        ResultReason.SynthesizingAudio,
                        audioWithHeader));
                this.privSpeechSynthesizer.synthesizing(this.privSpeechSynthesizer, ev);
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    }

    protected onSynthesisCancelled(result: SpeechSynthesisResult): void {
        if (!!this.privSpeechSynthesizer.SynthesisCanceled) {
            const cancelEvent: SpeechSynthesisEventArgs = new SpeechSynthesisEventArgs(result);
            try {
                this.privSpeechSynthesizer.SynthesisCanceled(this.privSpeechSynthesizer, cancelEvent);
                /* eslint-disable no-empty */
            } catch { }
        }
    }

    protected onSynthesisCompleted(result: SpeechSynthesisResult): void {
        if (this.privSpeechSynthesizer.synthesisCompleted) {
            try {
                this.privSpeechSynthesizer.synthesisCompleted(
                    this.privSpeechSynthesizer,
                    new SpeechSynthesisEventArgs(result)
                );
            } catch (e) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    }

    protected onWordBoundary(wordBoundaryEventArgs: SpeechSynthesisWordBoundaryEventArgs): void {
        if (!!this.privSpeechSynthesizer.wordBoundary) {
            try {
                this.privSpeechSynthesizer.wordBoundary(this.privSpeechSynthesizer, wordBoundaryEventArgs);
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    }

    protected onVisemeReceived(visemeEventArgs: SpeechSynthesisVisemeEventArgs): void {
        if (!!this.privSpeechSynthesizer.visemeReceived) {
            try {
                this.privSpeechSynthesizer.visemeReceived(this.privSpeechSynthesizer, visemeEventArgs);
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    }

    protected onBookmarkReached(bookmarkEventArgs: SpeechSynthesisBookmarkEventArgs): void {
        if (!!this.privSpeechSynthesizer.bookmarkReached) {
            try {
                this.privSpeechSynthesizer.bookmarkReached(this.privSpeechSynthesizer, bookmarkEventArgs);
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    }
}
