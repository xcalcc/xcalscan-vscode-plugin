import * as vscode from 'vscode';
import logger from '../utils/logger';
import IScanTaskLog from '../model/scanTaskLog';
import DsrTreeNode from '../model/dsrTreeNode';
import DsrTreeNodeType from '../model/dsrTreeNodeType';
import scanManager from '../dataManager/scanManager';

class DsrTreeManager implements vscode.Disposable {
    private SCAN_TASK_LOG_PAGING_SIZE: number = 50;

    private scanTaskLogList: Array<IScanTaskLog> = [];

    /**
     * Load scan task log list
     * TODO: no paging, no support for VSCODE to open multiple projects
     * 
     * @param projectUUID The project uuid.
     * @param currentPage The current page number for paging, default 1.
     */
    public async getScanTaskLogData({projectUUID, currentPage=1}: { 
        projectUUID: string,
        currentPage?: number
    }) : Promise<DsrTreeNode[]> {
        let dsrTreeNodeList: DsrTreeNode[] = [];

        if(this.scanTaskLogList.length === 0) {
            const data = await scanManager.getScanTaskLogList({
                projectUUID,
                page: 1,
                size: this.SCAN_TASK_LOG_PAGING_SIZE
            });
    
            const dataList = data && data.content || [];

            logger.debug(`[display dsr result] scan task log list: ${dataList.length}, projectUUID=${projectUUID}, currentPage=${currentPage}`);

            dataList.map((item: any) => {
                this.scanTaskLogList.push(this.convertScanTaskLogToDto(item));
            });
        }

        if(this.scanTaskLogList.length === 0) {
            dsrTreeNodeList.push(new DsrTreeNode(DsrTreeNodeType.NO_DATA, projectUUID));
        } else {
            dsrTreeNodeList = this.scanTaskLogList.map(scanLog => 
                new DsrTreeNode(DsrTreeNodeType.COMMIT_DATA, projectUUID, scanLog)
            );
        }

        return dsrTreeNodeList;
    }

    private convertScanTaskLogToDto(data: any): IScanTaskLog {
        return {
            commitId: data['commitId'],
            baselineCommitId: data['baselineCommitId'],
            fixedCount: data['fixedCount'],
            newCount: data['newCount'],
            scanEndAt: data['scanEndAt'],
            scanStartAt: data['scanStartAt'],
            scanTaskId: data['scanTaskId'],
            status: data['status'],
        }
    }

    /**
     * Clear cached data of the previous scan
     *
     */
    public deleteScanTaskLogData(projectId: string) {
        this.scanTaskLogList = [];
    }

    /**
     * Dispose object
     *
     */
    public dispose(): void {
        this.scanTaskLogList = [];
    }
}

export default new DsrTreeManager();