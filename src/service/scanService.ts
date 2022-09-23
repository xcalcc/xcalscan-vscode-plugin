import http from "./httpService";

export function addScanTask(projectId: string, status: string) {
    return http.post(
        `/api/scan_service/v2/project/${projectId}/scan_task/${status}`
    );
}

export function getScanStatus(projectId: string) {
    return http.get(`/api/scan_service/v2/project/${projectId}/scan_task`);
}

export function getScanSummary(projectId: string) {
    return http.get(`/api/scan_service/v2/project/${projectId}/scan_summary`);
}

export function startScanTaskPipeline(data: object){
    return http.post('/api/scan_task_service/v2', data);
}

export function updateScanTask(scanTaskId: string, stage: string, status: string, unifyErrorCode: string) {
    return http.put(`/api/scan_service/v2/scan_task/${scanTaskId}`, {
        id: scanTaskId,
        stage,
        status,
        unifyErrorCode
    })
}

export function getScanTaskLog({
    projectUUID,
    commitIdPattern,
    targetRangeStartDate,
    targetRangeEndDate,
    page = 1,
    size = 50,
}: {
    projectUUID: string,
    commitIdPattern?: string,
    targetRangeStartDate?: number,
    targetRangeEndDate?: number,
    page: number,
    size: number,
}) {
    return http.post(`/api/scan_service/v2/scan_task_log`,
        {
            projectId: projectUUID,
            commitIdPattern,
            targetRangeStartDate,
            targetRangeEndDate,
        },
        {
            paramsSerializer: function () {
                let params = [];
                params.push(`page=${page - 1}`);
                params.push(`size=${size}`);
                return params.join("&");
            }
        }
    );
}

export default {
    addScanTask,
    getScanStatus,
    getScanSummary,
    startScanTaskPipeline,
    updateScanTask,
    getScanTaskLog
};