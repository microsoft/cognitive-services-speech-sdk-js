// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

type TWorkerMessage = ICallNotification | IClearResponse | IErrorNotification | IErrorResponse;

interface IClearResponse {
    error: null;
    id: number;
}

interface IErrorNotification {
    error: {
        message: string;
    };
    id: null;
    result: null;
}

interface IErrorResponse {
    error: {
        message: string;
    };
    id: number;
    result: null;
}

interface ICallNotification {
    id: null;
    method: "call";
    params: {
        timerId: number;
    };
}

interface ISetNotification {
    id: null;
    method: "set";
    params: {
        delay: number;
        now: number;
        timerId: number;
    };
}

interface IClearRequest {
    id: number;
    method: "clear";
    params: {
        timerId: number;
    };
}

interface IWorkerEvent extends Event {
    data: TWorkerMessage;
}

interface IWorkerTimers {
    clearTimeout: (timerId: number) => void;
    setTimeout: (func: () => any, delay: number) => number;
}

declare type Func = () => any;

export class Timeout {

    private static workerTimers: null | IWorkerTimers = null;

    public static clearTimeout: IWorkerTimers["clearTimeout"] = (timerId: number): void => Timeout.timers().clearTimeout(timerId);

    public static setTimeout: IWorkerTimers["setTimeout"] = (func: () => any, delay: number): number => Timeout.timers().setTimeout(func, delay);

    public static load(): any {
        if (typeof window !== "undefined") {
            // Prefilling the Maps with a function indexed by zero is necessary to be compliant with the specification.
            const scheduledTimeoutFunctions: Map<number, number | Func> = new Map([[0, (): void => { }]]); // eslint-disable-line @typescript-eslint/no-empty-function
            const unhandledRequests: Map<number, number> = new Map();
            const getTimeoutWorker = (): Worker =>
                new Worker(
                    /* webpackChunkName: "precompiled-timeout-worker-web-worker" */
                    // eslint-disable-next-line @typescript-eslint/tslint/config
                    new URL("timeout-worker.js", import.meta.url)
                );

            const worker = getTimeoutWorker();

            worker.addEventListener("message", ({ data }: IWorkerEvent): void => {
                if (Timeout.isCallNotification(data)) {
                    const {
                        params: { timerId }
                    } = data;

                    const idOrFunc = scheduledTimeoutFunctions.get(timerId);

                    if (typeof idOrFunc === "number") {
                        const unhandledTimerId = unhandledRequests.get(idOrFunc);

                        if (
                            unhandledTimerId === undefined ||
                            unhandledTimerId !== timerId
                        ) {
                            throw new Error("The timer is in an undefined state.");
                        }
                    } else if (typeof idOrFunc !== "undefined") {
                        idOrFunc();

                        // A timeout can be safely deleted because it is only called once.
                        scheduledTimeoutFunctions.delete(timerId);
                    } else {
                        throw new Error("The timer is in an undefined state.");
                    }
                } else if (Timeout.isClearResponse(data)) {
                    const { id } = data;

                    const unhandledTimerId = unhandledRequests.get(id);

                    if (unhandledTimerId === undefined) {
                        throw new Error("The timer is in an undefined state.");
                    }

                    unhandledRequests.delete(id);

                    scheduledTimeoutFunctions.delete(unhandledTimerId);
                } else {
                    const {
                        error: { message }
                    } = data;

                    throw new Error(message);
                }
            });

            const clearTimeout = (timerId: number): void => {
                const id = Math.random();

                unhandledRequests.set(id, timerId);
                scheduledTimeoutFunctions.set(timerId, id);

                worker.postMessage({
                    id,
                    method: "clear",
                    params: { timerId }
                } as IClearRequest);
            };

            const setTimeout = (func: () => void, delay: number): number => {
                const timerId = Math.random();

                scheduledTimeoutFunctions.set(timerId, func);

                worker.postMessage({
                    id: null,
                    method: "set",
                    params: {
                        delay,
                        now: performance.now(),
                        timerId
                    }
                } as ISetNotification);

                return timerId;
            };

            return {
                clearTimeout,
                setTimeout
            };
        }
    }

    private static loadWorkerTimers(): () => IWorkerTimers {
        return (): IWorkerTimers => {
            if (Timeout.workerTimers !== null) {
                return Timeout.workerTimers;
            }

            Timeout.workerTimers = Timeout.load() as IWorkerTimers;

            return Timeout.workerTimers;
        };
    }

    public static timers: () => IWorkerTimers = Timeout.loadWorkerTimers();

    private static isCallNotification(message: TWorkerMessage): message is ICallNotification {
        return (message as ICallNotification).method !== undefined && (message as ICallNotification).method === "call";
    }

    private static isClearResponse(message: TWorkerMessage): message is IClearResponse {
        return (message as IClearResponse).error === null && typeof message.id === "number";
    }
}
