import http from './httpService';

export function getProjectByUuid(uuid: string) {
    return http.get(`/api/project_service/v2/project/${uuid}`);
}

export function getProjectList({
    page = 0,
    size = 500,
    sort = null
} = {}) {
    return http.get(
        '/api/project_service/v3/project_summaries', {
            params: {
                page,
                size,
                sort
            }
        }
    );
}

export function createProject({
    projectName = '',
    projectId = '',
    configName = '',
    projectConfig = {},
    scanConfig = {},
    attributes = {}
}) {
    return http.post(
        '/api/project_service/v2/project', {
            projectName,
            projectId,
            configName,
            projectConfig,
            scanConfig,
            attributes
        });
}

export function getProjectConfigByProjectKey(projectKey: string) {
    return http.get(`/api/project_service/v2/project/project_id/${projectKey}/config`);
}

export function getProjectConfigByProjectUuid(projectUuid: string) {
    return http.get(`/api/project_service/v2/project/${projectUuid}/config`);
}

export default {
    getProjectByUuid,
    getProjectList,
    createProject,
    getProjectConfigByProjectKey,
    getProjectConfigByProjectUuid
};