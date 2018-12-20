import { IKeyValueStorage } from "./IKeyValueStorage";
export declare class InMemoryStorage implements IKeyValueStorage {
    private privStore;
    get: (key: string) => string;
    getOrAdd: (key: string, valueToAdd: string) => string;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
}
