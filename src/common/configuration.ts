import { 
    workspace, 
    Uri, 
    WorkspaceFolder, 
    TextDocument, 
    WorkspaceConfiguration, 
    ConfigurationTarget 
} from 'vscode';

class Configuration {
    public configuration(scope?: Uri | WorkspaceFolder | TextDocument | undefined): WorkspaceConfiguration {
        return workspace.getConfiguration("xcalscan", scope);
    }

    public get(configName: string,  scope?: Uri | WorkspaceFolder | TextDocument | undefined) {
        return this.configuration().get<string>(configName) || '';
    }

    public update(
        configName: string, 
        configValue: any, 
        configurationTarget?: boolean | ConfigurationTarget | undefined) {
            return this.configuration().update(configName, configValue, configurationTarget);
    }
} 
