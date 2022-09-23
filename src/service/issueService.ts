import http from './httpService';
import apiConfig from './apiConfig';

export function searchIssueList({
    projectId,
    scanTaskId,
    scanFileIds,
    dsrType,
    csvCodes,
    issueGroupId,
    page = 0,
    size = 10,
    sort
}: {
    projectId?: string,
    scanTaskId?: string,
    scanFileIds: Array<string>,
    dsrType?: Array<string>,
    csvCodes?: Array<{csvCode: string, criticality: string}>,
    issueGroupId?: string,
    page: number,
    size: number,
    sort?: Array<string>
}) {
    return http.post(`${apiConfig.issueServiceV3}/search_issue_group`,
        {
            projectId,
            scanTaskId,
            scanFileIds,
            ruleCodes: csvCodes,
            dsrType,
            issueGroupId
        },
        {
            paramsSerializer:function(){
                let params = [];
                params.push(`page=${page - 1}`);
                params.push(`size=${size}`);
                sort?.forEach((x: string)=>{
                    params.push(`sort=${x}`);
                });
                return params.join("&");
            }
        }
    );
}

export function getIssueSummaryByScanFileId(projectId: string, scanFileIds: string[]) {
    return http.post(
        `${apiConfig.issueServiceV3}/issue_group_criticality_count`, {
            projectId,
            scanFileIds
        }
    )
}

export function getIssueTracePathList(issueGroupId: string, page: number = 0, size: number = 100) {
    return http.get(`${apiConfig.issueServiceV3}/issue_group/${issueGroupId}/issues`, {
        params: {
            page: page - 1,
            size
        }
    });
}

export default {
    searchIssueList,
    getIssueTracePathList,
    getIssueSummaryByScanFileId
};