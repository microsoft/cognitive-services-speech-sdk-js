import { IConnection } from "../common/Exports";
import { AuthInfo, IConnectionFactory, RecognizerConfig } from "./Exports";
export declare class IntentConnectionFactory implements IConnectionFactory {
    create: (config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string) => IConnection;
    private host;
    private readonly isDebugModeEnabled;
    private getSpeechRegionFromIntentRegion;
}
