import { IKeyValueStorage } from "../common/Exports";
export declare class SessionStorage implements IKeyValueStorage {
    get: (key: string) => string;
    getOrAdd: (key: string, valueToAdd: string) => string;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
}
