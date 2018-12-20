import { IKeyValueStorage } from "./IKeyValueStorage";
export declare class Storage {
    private static privSessionStorage;
    private static privLocalStorage;
    static setSessionStorage: (sessionStorage: IKeyValueStorage) => void;
    static setLocalStorage: (localStorage: IKeyValueStorage) => void;
    static readonly session: IKeyValueStorage;
    static readonly local: IKeyValueStorage;
}
