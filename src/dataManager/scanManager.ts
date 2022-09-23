import * as vscode from 'vscode';
import utils from '../utils';
import common from '../common';
import logger from '../utils/logger';
import { SCAN_TASK_STATUS, API_UNIFY_ERROR_CODE } from '../common/constants';
import scanService from '../service/scanService';
import ruleManager from '../dataManager/ruleManager';
import { channel, ChannelType } from '../common/channel';
import agentManager from './_agentManager';
import preprocessManager from '../dataManager/preprocessManager';
import IIssueSummary from '../model/issueSummary';
import IRuleSet from '../model/ruleSet';

class ScanManager {
    private currScanningStateData: any = {};

    public start({context, projectUUID, projectPath} : {
        context: vscode.ExtensionContext, 
        projectUUID: string, 
        projectPath: string
    }) {
        preprocessManager.startPreprocess({
            context, 
            projectPath
        })
        .then(() => {
            logger.info('get scan status', true);
            channel.clear(ChannelType.scanProgress);
            channel.show(ChannelType.scanProgress);
            this.loopGetScanStatus(projectUUID);
        })
        .catch(err => {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
        });
    }

    /* Unuseful */
    private useXcalAgent(projectUUID: string, sourcePath: string, buildPath: string, scanConfig: any, isUploadSource: boolean) {
        logger.info('create scan task', true);

        //Create a scan task
        scanService.addScanTask(projectUUID, SCAN_TASK_STATUS.pending)
        .then(response => {
            const data = response.data || {};
            const scanTaskId = data.id;

            agentManager.startAgent({
                projectId: projectUUID,
                projectPath: sourcePath || '',
                buildPath: buildPath || sourcePath || '',
                scanTaskId: scanTaskId,
                scanConfig: scanConfig,
                allowUploadSourceCode: isUploadSource
            })
            .then(() => {
                logger.info('get scan status - useXcalAgent', true);

                channel.clear(ChannelType.scanProgress);
                channel.show(ChannelType.scanProgress);
                this.loopGetScanStatus(projectUUID);
            })
            .catch(err => {
                utils.prompt.showErrorMessage(common.getApiMessage(err));
                this.updateScanTaskToFailed(scanTaskId);
            });
        })
        .catch(err => {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
        });
    }

    public async hasUnfinishedScan(projectUUID: string): Promise<boolean>{
        logger.info('Check the scan status of the current project');
        try {
            const response = await scanService.getScanStatus(projectUUID);
            const data = response.data || {};
            const scanStatus = data.status;

            logger.info(`latest scan status: projectUUID=${projectUUID}, status=${scanStatus}`);

            if ([
                SCAN_TASK_STATUS.pending, 
                SCAN_TASK_STATUS.processing
            ].includes(scanStatus)) {
                return true;
            }

            return false;

        } catch (err) {
            if(Object(err).response && Object(err).response.status === 404) {
                return false;
            }
            throw new Error(common.getApiMessage(err));
        }
    }

    public async getScanTaskLogList({projectUUID, page, size}: {projectUUID: string, page: number, size: number}) {
        return scanService
            .getScanTaskLog({
                projectUUID,
                page,
                size
            })
            .then((response: any) => {
                return response.data;
            })
            .catch(err => {
                utils.prompt.showErrorMessage(common.getApiMessage(err));
            })
    }

    private updateScanTaskToFailed(scanTaskId: string) {
        scanService
            .updateScanTask(scanTaskId, 'AGENT_START', SCAN_TASK_STATUS.failed, API_UNIFY_ERROR_CODE.SCANTASKSTATUS_UPDATE_VALIDATE_FAIL)
            .catch(err => {
                logger.error('updateScanTaskToFailed() failed. scanTaskId:' + scanTaskId);
            })
    }

    private loopGetScanStatus(projectUUID: string) {
        scanService
            .getScanStatus(projectUUID)
            .then(response => {
                const data = response.data || {};
                const scanStatus = data.status;

                this.printScanningMsg(data);

                switch(scanStatus) {
                    case SCAN_TASK_STATUS.completed:
                        this.scanSuccess(projectUUID);
                        break;
                    case SCAN_TASK_STATUS.failed:
                    case SCAN_TASK_STATUS.terminated:
                        this.showScanError(data);
                        break;
                    case SCAN_TASK_STATUS.pending:
                    case SCAN_TASK_STATUS.processing:
                        setTimeout(() => {
                            this.loopGetScanStatus(projectUUID);
                        }, 7000);
                        break;
                    default:
                        break;
                }
            })
            .catch(err => {
                utils.prompt.showErrorMessage(common.getApiMessage(err));
            });
    }

    private scanSuccess(projectId: string) {
        utils.prompt.showInformationMessage('扫描成功');
        vscode.commands.executeCommand('xcalscan.viewScanResult', projectId, true);
    }

    public async getScanSummary (context: vscode.ExtensionContext, projectUUID: string): Promise<IIssueSummary | undefined> {
        const ruleSets: IRuleSet[] | undefined = await ruleManager.getRuleSets(context);

        return scanService
            .getScanSummary(projectUUID)
            .then(response => {
                const responseData = response.data || {};
                const data = responseData.latestScanTask || {};

                const issueSummary = data.issueSummary || {};
                const ruleSetSummaryMap = data.ruleSetSummaryMap || {};
                let scanTime, totalTime;

                logger.info(`[get scan summary] scanTaskStatus=${data.status}, scanTaskId=${data.scanTaskId}`);

                if (data.status === SCAN_TASK_STATUS.pending || data.status === SCAN_TASK_STATUS.processing) {
                    channel.clear(ChannelType.scanProgress);
                    channel.show(ChannelType.scanProgress);
                    this.loopGetScanStatus(projectUUID);
                    return;
                }

                if (data.scanStartAt && data.scanEndAt) {
                    const date = utils.date.parseDate(Number(data.scanStartAt) || data.scanStartAt);
                    scanTime = utils.date.dateFormat(date, 'yyyy/MM/dd hh:mm');

                    const second = Math.ceil((data.scanEndAt - data.scanStartAt) / 1000);
                    totalTime = utils.date.secondToTime(second);
                }

                let ruleSetNames: string[] = [];

                if (ruleSets) {
                    ruleSetNames = Object.keys(ruleSetSummaryMap).map(ruleSetId => {
                        const ruleSet = ruleSets.find((x: {id: string}) => x.id === ruleSetId);
                        return ruleSet?.displayName || ruleSetId;
                    });
                }

                return {
                    projectName: responseData.projectName,
                    hasDsr: responseData.hasDsr,
                    fileCount: issueSummary.fileCount || "-",
                    lineCount: issueSummary.lineCount || "-",
                    issuesCount: issueSummary.issuesCount || "-",
                    scanTime: scanTime || "-",
                    totalTime: totalTime || "-",
                    ruleSetNames: ruleSetNames,
                    scanTaskId: data.scanTaskId,
                    status: data.status
                };
            });
    }

    private showScanError(data: any) {
        let message = common.formattingApiMessage(data.localizedMessage || data.message, data.unifyErrorCode);
        utils.prompt.showErrorMessage(message);
    }

    private printScanningMsg = (data: any) => {
        const msgList = data.message.match(/\[.+?\]/g);
        const message = msgList ? msgList[0] : data.message;
        const unifyErrorCode = data.unifyErrorCode;

        const isNewStatus = data.status !== this.currScanningStateData.status
                            || data.message !== this.currScanningStateData.message
                            || data.stage !== this.currScanningStateData.stage;

        if (isNewStatus) {
            let time = utils.date.parseDate(data.createdOn);
            let msg = utils.date.dateFormat(time, "[hh:mm:ss]");
            msg += ' ' + message;
            msg += unifyErrorCode ? `(${unifyErrorCode})` : '';

            this.currScanningStateData = data;

            channel.appendLine(msg, ChannelType.scanProgress);
            logger.info(JSON.stringify(data));
        }
    };
}

export default new ScanManager();