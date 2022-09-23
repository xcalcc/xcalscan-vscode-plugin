import * as vscode from 'vscode';
import utils from '../utils';
import common from '../common';
import projectService from '../service/projectService';
import projectManager from '../dataManager/projectManager';
import configurationManager from '../dataManager/configurationManager';
import { ProjectTreeNode, ProjectTreeNodeType } from '../model/projectTreeNode';
import IProjectConfig from '../model/projectConfig';
import IApiError, {isApiError} from '../model/apiError';
import vsDocumentManager from '../dataManager/vsDocumentManager';
import userManager from '../dataManager/userManager';
import logger from '../utils/logger';

interface IQuickItemEx<T> extends vscode.QuickPickItem {
    value: T;
}

let selectedProjectKey: string | undefined = undefined;

export async function linkWithProject(mainTreeView: vscode.TreeView<ProjectTreeNode | undefined>){
    let workspaceFolder: vscode.WorkspaceFolder | undefined = undefined;
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if(!workspaceFolders) {
        utils.prompt.showWarningMessage("请打开要扫描的项目");
        return;
    }

    if(!userManager.isLogin()){
        utils.prompt.showWarningMessage('请先登录。');
        vscode.commands.executeCommand('xcalscan.login');
        return;
    }

    if(workspaceFolders.length === 1) {
        workspaceFolder = workspaceFolders[0];

    } else if(mainTreeView.selection && mainTreeView.selection.length > 0) {
        const selection = mainTreeView.selection[0];
        if(selection?.nodeType === ProjectTreeNodeType.PROJECT) {
            //Select root node
            const path = selection.path;
            workspaceFolder = vsDocumentManager.getWorkspaceFolder(path)
        } else {
            //Select child node
            utils.prompt.showWarningMessage("请选择项目根目录");
            return;
        }
    } else {
        utils.prompt.showWarningMessage("请先选择要关联的项目");
        return;
    }

    if(workspaceFolder) {
        selectedProjectKey = configurationManager.getLinkedProjectId(workspaceFolder);
    } else {
        selectedProjectKey = undefined;
    }

    projectService
        .getProjectList()
        .then(response => {
            let resData = response.data;
            let projectList = resData.content || [];

            projectList.sort((a: any, b: any) => {
                let aTime = a.modifiedOn ? utils.date.parseDate(a.modifiedOn).getTime() : 0;
                let bTime = b.modifiedOn ? utils.date.parseDate(b.modifiedOn).getTime() : 0;

                return aTime > bTime ? -1 : 1;
            });

            parseDataToPicks(projectList, workspaceFolder);
        })
        .catch(err => {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
        });
}

async function parseDataToPicks(projectList: any, workspaceFolder?: vscode.WorkspaceFolder){
    const picks: Array<IQuickItemEx<string>> = [];

    picks.push({
        label: '$(remove-close) 解除项目关联',
        description: '',
        detail: '解除当前项目和扫描结的关联关系',
        value: '@unlink@'
    });

    //Creat pick list
    projectList.forEach((project: any) => {
        const summary = project.summary || {};
        const ruleSetSummaryMap = summary.ruleSetSummaryMap || {};
        const summaryAll = ruleSetSummaryMap.all || {};

        const date = utils.date.parseDate(project.modifiedOn);
        const pickLabel = project.name + (summaryAll.issuesCount ? ` (缺陷数: ${summaryAll.issuesCount})` : ' (扫描失败)');

        const pickData = {
            label: pickLabel,
            description: '',
            detail: `更新时间: ${utils.date.dateFormat(date, 'yyyy-MM-dd')}`,
            value: project
        };

        if(project.projectId === selectedProjectKey){
            //Set selected flag
            pickData.label = `$(check) ${pickLabel}`;
        }

        picks.push(pickData);
    });

    const placeHolder = '选择一个已存在的项目和当前项目进行关联';
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks, {placeHolder: placeHolder});

    if (!choice) {
        return;
    }

    if(choice.value === '@unlink@') {
        vscode.commands.executeCommand('xcalscan.unlink');
    } else {
        const projectData: any = choice.value || {};
        selectedProjectKey = projectData['projectId'];

        await saveProjectDataToLocal(projectData, workspaceFolder);
        //view project
        vscode.commands.executeCommand('xcalscan.viewScanResult', projectData['id'], false);
    }
}

/*
 * For the link local and remote project
 */
async function saveProjectDataToLocal(projectData: any, workspaceFolder?: vscode.WorkspaceFolder) {
    
    const projectConfig: IProjectConfig | IApiError = await projectManager.getProjectConfigByProjectUuid(projectData.id);
    
    if(isApiError(projectConfig)) {
        utils.prompt.showErrorMessage(common.getApiMessage(projectConfig.error));
        return;
    }

    if(workspaceFolder) {
        await configurationManager.updateLinkedProjectId(projectData.projectId, workspaceFolder);
    } else {
        logger.error('workspaceFolder is undefined. - saveProjectDataToLocal()')
        logger.error(workspaceFolder);
    }
}