 import issueService from '../service/issueService';
 import common from '../common';
 
class IssueManager {
     /*
     * Fetch issue summary by scan file id from API
     */
    public async fetchIssueSummaryByScanFileId(projectId: string, scanFileId: string){
        return issueService.getIssueSummaryByScanFileId(
            projectId,
            [scanFileId]
        )
        .then(response => {
            return response.data || {};
        })
        .catch(err => {
            return Promise.reject(common.getApiMessage(err));
        });
    }

    /*
     * Fetch issue trace path list from API
     */
    public async fetchIssueTracePathList(issueGroupId: string, pageNumber: number, pageSize: number) {
        return issueService.getIssueTracePathList(
            issueGroupId,
            pageNumber,
            pageSize
        )
        .then((response: any) => {
            return response.data || {};
        })
        .catch(err => {
            return Promise.reject(common.getApiMessage(err));
        });
    }

    /*
     * Fetch issue list from API
     */
    public async fetchIssueList({projectId, scanTaskId, scanFileIds, dsrType, csvCodes, issueGroupId, pageNumber, pageSize}: {
        projectId?: string,
        scanTaskId?: string,
        scanFileIds: Array<string>, 
        dsrType?: Array<string>, 
        csvCodes?: Array<{csvCode: string, criticality: string}>,
        issueGroupId?: string,
        pageNumber: number,
        pageSize: number
    }) {
        return issueService.searchIssueList({
            projectId,
            scanTaskId,
            scanFileIds, 
            dsrType,
            csvCodes, 
            issueGroupId,
            page: pageNumber, 
            size: pageSize
        })
        .then((response: any) => {
            return response.data || {};
        })
        .catch(err => {
            return Promise.reject(common.getApiMessage(err));
        });
    }
}
 
export default new IssueManager();