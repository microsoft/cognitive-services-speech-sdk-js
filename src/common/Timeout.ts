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
        // Prefilling the Maps with a function indexed by zero is necessary to be compliant with the specification.
        const scheduledTimeoutFunctions: Map<number, number | Func> = new Map([[0, (): void => { }]]); // eslint-disable-line @typescript-eslint/no-empty-function
        const unhandledRequests: Map<number, number> = new Map();

        const worker = new Worker("data:text/javascript;base64,Ly8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuCi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS4KLyogZXNsaW50LWRpc2FibGUgKi8KIWZ1bmN0aW9uKGUpe3ZhciB0PXt9O2Z1bmN0aW9uIG4ocil7aWYodFtyXSlyZXR1cm4gdFtyXS5leHBvcnRzO3ZhciBvPXRbcl09e2k6cixsOiExLGV4cG9ydHM6e319O3JldHVybiBlW3JdLmNhbGwoby5leHBvcnRzLG8sby5leHBvcnRzLG4pLG8ubD0hMCxvLmV4cG9ydHN9bi5tPWUsbi5jPXQsbi5kPWZ1bmN0aW9uKGUsdCxyKXtuLm8oZSx0KXx8T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6cn0pfSxuLnI9ZnVuY3Rpb24oZSl7InVuZGVmaW5lZCIhPXR5cGVvZiBTeW1ib2wmJlN5bWJvbC50b1N0cmluZ1RhZyYmT2JqZWN0LmRlZmluZVByb3BlcnR5KGUsU3ltYm9sLnRvU3RyaW5nVGFnLHt2YWx1ZToiTW9kdWxlIn0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLCJfX2VzTW9kdWxlIix7dmFsdWU6ITB9KX0sbi50PWZ1bmN0aW9uKGUsdCl7aWYoMSZ0JiYoZT1uKGUpKSw4JnQpcmV0dXJuIGU7aWYoNCZ0JiYib2JqZWN0Ij09dHlwZW9mIGUmJmUmJmUuX19lc01vZHVsZSlyZXR1cm4gZTt2YXIgcj1PYmplY3QuY3JlYXRlKG51bGwpO2lmKG4ucihyKSxPYmplY3QuZGVmaW5lUHJvcGVydHkociwiZGVmYXVsdCIse2VudW1lcmFibGU6ITAsdmFsdWU6ZX0pLDImdCYmInN0cmluZyIhPXR5cGVvZiBlKWZvcih2YXIgbyBpbiBlKW4uZChyLG8sZnVuY3Rpb24odCl7cmV0dXJuIGVbdF19LmJpbmQobnVsbCxvKSk7cmV0dXJuIHJ9LG4ubj1mdW5jdGlvbihlKXt2YXIgdD1lJiZlLl9fZXNNb2R1bGU/ZnVuY3Rpb24oKXtyZXR1cm4gZS5kZWZhdWx0fTpmdW5jdGlvbigpe3JldHVybiBlfTtyZXR1cm4gbi5kKHQsImEiLHQpLHR9LG4ubz1mdW5jdGlvbihlLHQpe3JldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZSx0KX0sbi5wPSIiLG4obi5zPTE0KX0oW2Z1bmN0aW9uKGUsdCxuKXsidXNlIHN0cmljdCI7bi5kKHQsImEiLChmdW5jdGlvbigpe3JldHVybiBpfSkpLG4uZCh0LCJiIiwoZnVuY3Rpb24oKXtyZXR1cm4gdX0pKSxuLmQodCwiYyIsKGZ1bmN0aW9uKCl7cmV0dXJuIGF9KSksbi5kKHQsImQiLChmdW5jdGlvbigpe3JldHVybiBkfSkpO2NvbnN0IHI9bmV3IE1hcCxvPW5ldyBNYXAsaT1lPT57Y29uc3QgdD1yLmdldChlKTtpZih2b2lkIDA9PT10KXRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgbm8gaW50ZXJ2YWwgc2NoZWR1bGVkIHdpdGggdGhlIGdpdmVuIGlkICInLmNvbmNhdChlLCciLicpKTtjbGVhclRpbWVvdXQodCksci5kZWxldGUoZSl9LHU9ZT0+e2NvbnN0IHQ9by5nZXQoZSk7aWYodm9pZCAwPT09dCl0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIG5vIHRpbWVvdXQgc2NoZWR1bGVkIHdpdGggdGhlIGdpdmVuIGlkICInLmNvbmNhdChlLCciLicpKTtjbGVhclRpbWVvdXQodCksby5kZWxldGUoZSl9LGY9KGUsdCk9PntsZXQgbixyO2lmKCJwZXJmb3JtYW5jZSJpbiBzZWxmKXtjb25zdCBvPXBlcmZvcm1hbmNlLm5vdygpO249byxyPWUtTWF0aC5tYXgoMCxvLXQpfWVsc2Ugbj1EYXRlLm5vdygpLHI9ZTtyZXR1cm57ZXhwZWN0ZWQ6bityLHJlbWFpbmluZ0RlbGF5OnJ9fSxjPShlLHQsbixyKT0+e2NvbnN0IG89InBlcmZvcm1hbmNlImluIHNlbGY/cGVyZm9ybWFuY2Uubm93KCk6RGF0ZS5ub3coKTtvPm4/cG9zdE1lc3NhZ2Uoe2lkOm51bGwsbWV0aG9kOiJjYWxsIixwYXJhbXM6e3RpbWVySWQ6dH19KTplLnNldCh0LHNldFRpbWVvdXQoYyxuLW8sZSx0LG4pKX0sYT0oZSx0LG4pPT57Y29uc3R7ZXhwZWN0ZWQ6byxyZW1haW5pbmdEZWxheTppfT1mKGUsbik7ci5zZXQodCxzZXRUaW1lb3V0KGMsaSxyLHQsbykpfSxkPShlLHQsbik9Pntjb25zdHtleHBlY3RlZDpyLHJlbWFpbmluZ0RlbGF5Oml9PWYoZSxuKTtvLnNldCh0LHNldFRpbWVvdXQoYyxpLG8sdCxyKSl9fSxmdW5jdGlvbihlLHQsbil7InVzZSBzdHJpY3QiO24ucih0KTt2YXIgcj1uKDIpO2Zvcih2YXIgbyBpbiByKSJkZWZhdWx0IiE9PW8mJmZ1bmN0aW9uKGUpe24uZCh0LGUsKGZ1bmN0aW9uKCl7cmV0dXJuIHJbZV19KSl9KG8pO3ZhciBpPW4oMyk7Zm9yKHZhciBvIGluIGkpImRlZmF1bHQiIT09byYmZnVuY3Rpb24oZSl7bi5kKHQsZSwoZnVuY3Rpb24oKXtyZXR1cm4gaVtlXX0pKX0obyk7dmFyIHU9big0KTtmb3IodmFyIG8gaW4gdSkiZGVmYXVsdCIhPT1vJiZmdW5jdGlvbihlKXtuLmQodCxlLChmdW5jdGlvbigpe3JldHVybiB1W2VdfSkpfShvKTt2YXIgZj1uKDUpO2Zvcih2YXIgbyBpbiBmKSJkZWZhdWx0IiE9PW8mJmZ1bmN0aW9uKGUpe24uZCh0LGUsKGZ1bmN0aW9uKCl7cmV0dXJuIGZbZV19KSl9KG8pO3ZhciBjPW4oNik7Zm9yKHZhciBvIGluIGMpImRlZmF1bHQiIT09byYmZnVuY3Rpb24oZSl7bi5kKHQsZSwoZnVuY3Rpb24oKXtyZXR1cm4gY1tlXX0pKX0obyk7dmFyIGE9big3KTtmb3IodmFyIG8gaW4gYSkiZGVmYXVsdCIhPT1vJiZmdW5jdGlvbihlKXtuLmQodCxlLChmdW5jdGlvbigpe3JldHVybiBhW2VdfSkpfShvKTt2YXIgZD1uKDgpO2Zvcih2YXIgbyBpbiBkKSJkZWZhdWx0IiE9PW8mJmZ1bmN0aW9uKGUpe24uZCh0LGUsKGZ1bmN0aW9uKCl7cmV0dXJuIGRbZV19KSl9KG8pO3ZhciBzPW4oOSk7Zm9yKHZhciBvIGluIHMpImRlZmF1bHQiIT09byYmZnVuY3Rpb24oZSl7bi5kKHQsZSwoZnVuY3Rpb24oKXtyZXR1cm4gc1tlXX0pKX0obyl9LGZ1bmN0aW9uKGUsdCl7fSxmdW5jdGlvbihlLHQpe30sZnVuY3Rpb24oZSx0KXt9LGZ1bmN0aW9uKGUsdCl7fSxmdW5jdGlvbihlLHQpe30sZnVuY3Rpb24oZSx0KXt9LGZ1bmN0aW9uKGUsdCl7fSxmdW5jdGlvbihlLHQpe30sZnVuY3Rpb24oZSx0LG4peyJ1c2Ugc3RyaWN0IjtuLnIodCk7dmFyIHI9bigxMSk7Zm9yKHZhciBvIGluIHIpImRlZmF1bHQiIT09byYmZnVuY3Rpb24oZSl7bi5kKHQsZSwoZnVuY3Rpb24oKXtyZXR1cm4gcltlXX0pKX0obyk7dmFyIGk9bigxMik7Zm9yKHZhciBvIGluIGkpImRlZmF1bHQiIT09byYmZnVuY3Rpb24oZSl7bi5kKHQsZSwoZnVuY3Rpb24oKXtyZXR1cm4gaVtlXX0pKX0obyk7dmFyIHU9bigxMyk7Zm9yKHZhciBvIGluIHUpImRlZmF1bHQiIT09byYmZnVuY3Rpb24oZSl7bi5kKHQsZSwoZnVuY3Rpb24oKXtyZXR1cm4gdVtlXX0pKX0obyl9LGZ1bmN0aW9uKGUsdCl7fSxmdW5jdGlvbihlLHQpe30sZnVuY3Rpb24oZSx0KXt9LGZ1bmN0aW9uKGUsdCxuKXsidXNlIHN0cmljdCI7bi5yKHQpO3ZhciByPW4oMCksbz1uKDEpO2Zvcih2YXIgaSBpbiBvKSJkZWZhdWx0IiE9PWkmJmZ1bmN0aW9uKGUpe24uZCh0LGUsKGZ1bmN0aW9uKCl7cmV0dXJuIG9bZV19KSl9KGkpO3ZhciB1PW4oMTApO2Zvcih2YXIgaSBpbiB1KSJkZWZhdWx0IiE9PWkmJmZ1bmN0aW9uKGUpe24uZCh0LGUsKGZ1bmN0aW9uKCl7cmV0dXJuIHVbZV19KSl9KGkpO2FkZEV2ZW50TGlzdGVuZXIoIm1lc3NhZ2UiLCh7ZGF0YTplfSk9Pnt0cnl7aWYoImNsZWFyIj09PWUubWV0aG9kKXtjb25zdHtpZDp0LHBhcmFtczp7dGltZXJJZDpufX09ZTtPYmplY3Qoci5iKShuKSxwb3N0TWVzc2FnZSh7ZXJyb3I6bnVsbCxpZDp0fSl9ZWxzZXtpZigic2V0IiE9PWUubWV0aG9kKXRocm93IG5ldyBFcnJvcignVGhlIGdpdmVuIG1ldGhvZCAiJy5jb25jYXQoZS5tZXRob2QsJyIgaXMgbm90IHN1cHBvcnRlZCcpKTt7Y29uc3R7cGFyYW1zOntkZWxheTp0LG5vdzpuLHRpbWVySWQ6b319PWU7T2JqZWN0KHIuZCkodCxvLG4pfX19Y2F0Y2godCl7cG9zdE1lc3NhZ2Uoe2Vycm9yOnttZXNzYWdlOnQubWVzc2FnZX0saWQ6ZS5pZCxyZXN1bHQ6bnVsbH0pfX0pfV0pOw==");

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
