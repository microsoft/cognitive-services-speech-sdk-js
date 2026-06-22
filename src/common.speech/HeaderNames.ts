// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class HeaderNames {
    public static AuthKey: string = "Ocp-Apim-Subscription-Key";
    public static Authorization: string = "Authorization";
    public static SpIDAuthKey: string = "Apim-Subscription-Id";
    public static ConnectionId: string = "X-ConnectionId";
    public static ContentType: string = "Content-Type";
    public static CustomCommandsAppId: string = "X-CommandsAppId";
    public static Path: string = "Path";
    public static RequestId: string = "X-RequestId";
    public static RequestStreamId: string = "X-StreamId";
    public static RequestTimestamp: string = "X-Timestamp";

    // Reliable reconnect protocol (service-originated) headers. The service tag is not a
    // header; it arrives in the turn.start body under "$.context.serviceTag".
    public static ContinuationToken: string = "X-Continuation-Token";
    // Resume offset for the single audio stream (id "1"); the stream's position otherwise
    // rides on X-Continuation-Token, so there is no per-primary-stream offset header.
    public static ContinuationAudioStreamOffset: string = "X-Continuation-Audio-Streams-1-Offset";
}
