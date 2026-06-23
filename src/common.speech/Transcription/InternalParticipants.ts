// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * The user who is participating in the meeting.
 */
export interface IInternalParticipant {
    id?: string;
    preferredLanguage?: string;
    voice?: string;
}

/** Users participating in the meeting */
export class InternalParticipants {

    public constructor(public participants: IInternalParticipant[] = []) {

    }

    /**
     * Add or update a participant
     * @param value
     */
    public addOrUpdateParticipant(value: IInternalParticipant): IInternalParticipant {
        if (value === undefined) {
            return;
        }

        const exists: number = this.getParticipantIndex(value.id);
        if (exists > -1) {
            this.participants.splice(exists, 1, value);
        } else {
            this.participants.push(value);
        }

        // ensure it was added ok
        return this.getParticipant(value.id);
    }

    /**
     * Find the participant's position in the participants list.
     * @param id
     */
    public getParticipantIndex(id: string): number {
        return this.participants.findIndex((p: IInternalParticipant): boolean => p.id === id);
    }

    /**
     * Find the participant by id.
     * @param id
     */
    public getParticipant(id: string): IInternalParticipant {
        return this.participants.find((p: IInternalParticipant): boolean => p.id === id);
    }

    /**
     * Remove a participant from the participants list.
     */
    public deleteParticipant(id: string): void {
        this.participants = this.participants.filter((p: IInternalParticipant): boolean => p.id !== id);
    }
}
