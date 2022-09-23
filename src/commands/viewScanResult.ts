import * as vscode from 'vscode';
import utils from '../utils';
import logger from '../utils/logger';
import common from '../common';
import { SCAN_TASK_STATUS } from '../common/constants';
import { channel, ChannelType } from '../common/channel';
import globalManager from '../dataManager/globalManager';
import projectTreeManager from '../dataManager/projectTreeManager';
import dsrTreeManager from '../dataManager/dsrTreeManager';
import issueTreeManager from '../dataManager/issueTreeManager';
import scanManager from '../dataManager/scanManager';
import IIssueSummary from '../model/issueSummary';

/**
 * View scan results
 *
 * @param projectId The project id.
 * @param isFromScanning If the current function is called after the scan is complete, the value is true, other is false.
 */
export async function viewScanResult(context: vscode.ExtensionContext, projectId: string, isFromScanning: boolean){
    vscode.commands.executeCommand('xcalscan.setLoadingOfTree');

    await scanManager
        .getScanSummary(context, projectId)
        .then(async (summaryData: IIssueSummary | undefined) => {
            const scanTaskId = summaryData?.scanTaskId;
            const projectName = summaryData?.projectName || '';

            if(summaryData === undefined) {
                utils.prompt.showErrorMessage(`${projectName}:正在扫描，请等待扫描结束后再查看。`);
                return;
            }

            if(!scanTaskId) {
                utils.prompt.showWarningMessage(`${projectName}:没有扫描记录，请扫描后再查看。`);
                return;
            }

            if(summaryData.status === SCAN_TASK_STATUS.failed){
                vscode.commands.executeCommand('xcalscan.refreshMainTree');
                // utils.prompt.showErrorMessage(`${projectName} 扫描失败，没有数据。`);
                return;
            }

            isFromScanning && logger.info('[scan] scan successful.');
            printIssuesSummary(projectName, summaryData);

            // clear the previous scanned data
            dsrTreeManager.deleteScanTaskLogData(projectId);
            projectTreeManager.deleteProjectData(projectId);
            issueTreeManager.deleteIssueData(projectId, summaryData.scanTaskId);

            projectTreeManager.setSummaryData(projectId, summaryData);
            globalManager.setIsShowDsrButtonInWhenContext(summaryData.hasDsr);
            if(!summaryData.hasDsr) {
                globalManager.setIsDsrViewInWhenContext(false);
            }
            logger.debug(`[view scan result] summary data: ${JSON.stringify(summaryData)}`);

            await projectTreeManager.initializationData({
                projectId, 
                projectName,
                scanTaskId: summaryData.scanTaskId
            });

            vscode.commands.executeCommand('xcalscan.scanResultLoadCompleted', projectId, scanTaskId);
        })
        .catch(err => {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
            isFromScanning && logger.info('[scan] scan failed.');
        });

    vscode.commands.executeCommand('xcalscan.cancelLoadingOfTree');
}

function printIssuesSummary(projectName: string, summaryData: IIssueSummary) {
    let outputList = [
        '项目: ' + projectName,
        '文件数量: ' + summaryData.fileCount,
        '代码行数: ' + summaryData.lineCount,
        '缺陷数量: ' + summaryData.issuesCount,
        '扫描时间: ' + summaryData.scanTime,
        '扫描时长: ' + summaryData.totalTime,
        '扫描选项: ' + summaryData.ruleSetNames.join(', ')
    ];

    channel.clear(ChannelType.scanSummary);
    channel.show(ChannelType.scanSummary);
    outputList.forEach(v => channel.appendLine(v, ChannelType.scanSummary));
}