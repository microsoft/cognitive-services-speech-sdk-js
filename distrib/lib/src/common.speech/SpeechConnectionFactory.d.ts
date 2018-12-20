import { IConnection } from "../common/Exports";
import { AuthInfo, IConnectionFactory, RecognizerConfig } from "./Exports";
export declare class SpeechConnectionFactory implements IConnectionFactory {
    create: (config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string) => IConnection;
    private host;
    private readonly interactiveRelativeUri;
    private readonly conversationRelativeUri;
    private readonly dictationRelativeUri;
    private readonly isDebugModeEnabled;
}
