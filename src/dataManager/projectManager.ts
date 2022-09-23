import projectService from '../service/projectService';
import IProjectConfig from '../model/projectConfig';
import IApiError from '../model/apiError';
import utils from '../utils';
import common from '../common';

class ProjectManager {

    public async getProjectUUID(projectKey: string): Promise<string | undefined> {
        return projectService
            .getProjectConfigByProjectKey(projectKey)
            .then(response => {
                const data = response.data;
                const uuid = data?.project?.id;
                return uuid;
            })
            .catch(err => {
                if(err.response.status === 401) {
                    throw new Error(common.getApiMessage(err));
                }
                return undefined;
            })
    }

    public async getProjectConfigByProjectUuid(projectUuid: string): Promise<IProjectConfig | IApiError> {
        return projectService
            .getProjectConfigByProjectUuid(projectUuid)
            .then(response => {
                const data = response.data;
                const projectConfig: IProjectConfig = data as IProjectConfig;
                return projectConfig;
            })
            .catch(err => {
                return {
                    error: err
                };
            })
    }

    public async getProjectName(projectUuid: string): Promise<string> {
        return projectService
            .getProjectByUuid(projectUuid)
            .then(response => {
                let data = response.data || {};
                return data['name'];
            })
            .catch(err => {
                utils.prompt.showErrorMessage(common.getApiMessage(err));
            });
    }
}

export default new ProjectManager();