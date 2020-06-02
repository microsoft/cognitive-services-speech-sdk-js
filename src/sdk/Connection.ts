//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import {
    ServiceRecognizerBase,
} from "../common.speech/Exports";
import {
    ConnectionEvent,
    ConnectionMessageReceivedEvent,
    ConnectionMessageSentEvent,
    IDetachable,
    ServiceEvent,
} from "../common/Exports";
import {
    ConnectionMessageImpl
} from "./ConnectionMessage";
import { Contracts } from "./Contracts";
import {
    ConnectionEventArgs,
    ConnectionMessageEventArgs,
    Recognizer,
    ServiceEventArgs,
} from "./Exports";

/**
 * Connection is a proxy class for managing connection to the speech service of the specified Recognizer.
 * By default, a Recognizer autonomously manages connection to service when needed.
 * The Connection class provides additional methods for users to explicitly open or close a connection and
 * to subscribe to connection status changes.
 * The use of Connection is optional, and mainly for scenarios where fine tuning of application
 * behavior based on connection status is needed. Users can optionally call Open() to manually set up a connection
 * in advance before starting recognition on the Recognizer associated with this Connection.
 * If the Recognizer needs to connect or disconnect to service, it will
 * setup or shutdown the connection independently. In this case the Connection will be notified by change of connection
 * status via Connected/Disconnected events.
 * Added in version 1.2.0.
 */
export class Connection {
    private privServiceRecognizer: ServiceRecognizerBase;
    private privEventListener: IDetachable;
    private privServiceEventListener: IDetachable;

    /**
     * Gets the Connection instance from the specified recognizer.
     * @param recognizer The recognizer associated with the connection.
     * @return The Connection instance of the recognizer.
     */
    public static fromRecognizer(recognizer: Recognizer): Connection {
        const recoBase: ServiceRecognizerBase = recognizer.internalData as ServiceRecognizerBase;

        const ret: Connection = new Connection();

        ret.privServiceRecognizer = recoBase;
        ret.privEventListener = ret.privServiceRecognizer.connectionEvents.attach((connectionEvent: ConnectionEvent): void => {
            if (connectionEvent.name === "ConnectionEstablishedEvent") {
                if (!!ret.connected) {
                    ret.connected(new ConnectionEventArgs(connectionEvent.connectionId));
                }
            } else if (connectionEvent.name === "ConnectionClosedEvent") {
                if (!!ret.disconnected) {
                    ret.disconnected(new ConnectionEventArgs(connectionEvent.connectionId));
                }
            } else if (connectionEvent.name === "ConnectionMessageSentEvent") {
                if (!!ret.messageSent) {
                    ret.messageSent(new ConnectionMessageEventArgs(new ConnectionMessageImpl((connectionEvent as ConnectionMessageSentEvent).message)));
                }
            } else if (connectionEvent.name === "ConnectionMessageReceivedEvent") {
                if (!!ret.messageReceived) {
                    ret.messageReceived(new ConnectionMessageEventArgs(new ConnectionMessageImpl((connectionEvent as ConnectionMessageReceivedEvent).message)));
                }
            }
        });

        ret.privServiceEventListener = ret.privServiceRecognizer.serviceEvents.attach((e: ServiceEvent): void => {
            if (!!ret.receivedServiceMessage) {
                ret.receivedServiceMessage(new ServiceEventArgs(e.jsonString, e.name));
            }
        });

        return ret;
    }

    /**
     * Starts to set up connection to the service.
     * Users can optionally call openConnection() to manually set up a connection in advance before starting recognition on the
     * Recognizer associated with this Connection. After starting recognition, calling Open() will have no effect
     *
     * Note: On return, the connection might not be ready yet. Please subscribe to the Connected event to
     * be notfied when the connection is established.
     */
    public openConnection(): void {
        this.privServiceRecognizer.connect();
    }

    /**
     * Closes the connection the service.
     * Users can optionally call closeConnection() to manually shutdown the connection of the associated Recognizer.
     *
     * If closeConnection() is called during recognition, recognition will fail and cancel with an error.
     */
    public closeConnection(): void {
        this.privServiceRecognizer.disconnect();
    }

    /**
     * Appends a parameter in a message to service.
     * Added in version 1.12.1.
     * @param path The path of the network message.
     * @param propertyName Name of the property
     * @param propertyValue Value of the property. This is a json string.
     */
    public setMessageProperty(path: string, propertyName: string, propertyValue: string): void {
        if (path.toLowerCase() !== "speech.context") {
            throw new Error("Only speech.context message property sets are currently supported");
        }
        Contracts.throwIfNullOrWhitespace(propertyName, "propertyName");

        this.privServiceRecognizer.speechContext.setSection(propertyName, propertyValue);
    }

    /**
     * Any message from service that is not being processed by any other top level recognizers.
     *
     * Will be removed in 2.0.
     */
    public receivedServiceMessage: (args: ServiceEventArgs) => void;

    /**
     * Any message received from the Speech Service.
     */
    public messageReceived: (args: ConnectionMessageEventArgs) => void;

    /**
     * Any message sent to the Speech Service.
     */
    public messageSent: (args: ConnectionMessageEventArgs) => void;

    /**
     * The Connected event to indicate that the recognizer is connected to service.
     */
    public connected: (args: ConnectionEventArgs) => void;

    /**
     * The Diconnected event to indicate that the recognizer is disconnected from service.
     */
    public disconnected: (args: ConnectionEventArgs) => void;

    /**
     * Dispose of associated resources.
     */
    public close(): void {
        /* tslint:disable:no-empty */
    }
}
