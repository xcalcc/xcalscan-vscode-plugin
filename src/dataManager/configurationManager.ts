import { workspace, ConfigurationTarget, WorkspaceFolder, Uri } from 'vscode';
import logger from '../utils/logger';
import projectManager from './projectManager';
import Configuration from '../model/configuration';
import { PLUGIN_LANGUAGE } from '../common/constants';

class ConfigurationManager {
    public configuration(scope?: Uri | WorkspaceFolder) {
        return workspace.getConfiguration('xcalscan', scope);
    }

    public getConfiguration(): Configuration {
        let serverAddress = this.configuration().get<string>('MandatoryServerAddress') || '';
        const clientPath = this.configuration().get<string>('MandatoryClientPath') || '';
        const language = this.configuration().get<string>('language') || PLUGIN_LANGUAGE.zhCN;

        if(serverAddress.endsWith('/')) {
            serverAddress = serverAddress.substring(0, serverAddress.length - 1);
        }

        return new Configuration(serverAddress, clientPath, language);
    }

    public setServerAddress(serverAddress: string): Thenable<void> {
        return this.configuration().update('MandatoryServerAddress', serverAddress, true);
    }

    public setClientPath(clientPath: string): Thenable<void> {
        return this.configuration().update('MandatoryClientPath', clientPath, true);
    }

    public isExistServerAddress(): boolean {
        let data = this.getConfiguration();
        return data.serverAddress !== '';
    }

    public updateLinkedProjectId(projectId: string | undefined, scope: Uri | WorkspaceFolder): Thenable<void> {
        return this.configuration(scope).update('OptionalServerProjectID', projectId, ConfigurationTarget.WorkspaceFolder);
    }

    public getLinkedProjectId(scope: Uri | WorkspaceFolder) {
        return this.configuration(scope).get<string>('OptionalServerProjectID')
    }

    public async getLocalProjectData(scope: Uri | WorkspaceFolder): Promise<{ 
        projectUUID: string, 
        projectKey: string
    }> {
        let projectUUID;
        let projectKey = this.configuration(scope).get<string>('OptionalServerProjectID');

        if(projectKey) {
            projectUUID = await projectManager.getProjectUUID(projectKey);

            if(!projectUUID) {
                await this.updateLinkedProjectId(undefined, scope);
                logger.info(`project not found by project key: ${projectKey}`);
            }
        }

        return {
            projectUUID: projectUUID || '',
            projectKey: projectKey || ''
        }
    }
}

export default new ConfigurationManager();