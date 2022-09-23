import * as vscode from 'vscode';
import * as path from 'path';
import utils from '../utils';
import logger from '../utils/logger';
import { XCALSCAN_FILES } from '../common/constants';
import globalManager from '../dataManager/globalManager';
import userManager from '../dataManager/userManager';
import scanManager from '../dataManager/scanManager';
import configurationManager from '../dataManager/configurationManager';
import projectManager from '../dataManager/projectManager';
import IProjectConfig from '../model/projectConfig';
import IApiError, {isApiError} from '../model/apiError';
import { ProjectTreeNode, ProjectTreeNodeType } from '../model/projectTreeNode';
import vsDocumentManager from '../dataManager/vsDocumentManager';

 /**
  * Create or scan project
  *
  * @param mainTreeView The main TreeView. Used scan button in the plugin to trigger a scan.
  * @param projectPath 
  *  The project path. Used to right-click the menu in the workspace to trigger a scan.
  *  If it is undefined, the workspaceFolders[0] path is used by default
  */
export async function createOrScan(context: vscode.ExtensionContext, mainTreeView: vscode.TreeView<ProjectTreeNode | undefined>, projectPath?: vscode.Uri | string) {
    let workspaceFolder: vscode.WorkspaceFolder | undefined = undefined;

    if(!basicValidation()) {
        return;
    }

    workspaceFolder = getWorkspaceFolder(mainTreeView, projectPath);

    if(!workspaceFolder) {
        return;
    }

    const scanConfigFilePath = path.resolve(workspaceFolder.uri.fsPath, XCALSCAN_FILES.SCAN_CONFIG_FILE);
    const scanConfigFileData: any = utils.file.readJsonSync(scanConfigFilePath);

    // if project id exists in both xcalscan.conf and Database, rescan, if not, create a new project
    let isRescan = false;
    let projectUUID: string | undefined;
    if(scanConfigFileData && scanConfigFileData.projectId) {
        projectUUID = await projectManager.getProjectUUID(scanConfigFileData.projectId);
        isRescan = !!projectUUID;
        logger.info(`[scan] check whether the project id exists in the server: ${isRescan}, ${scanConfigFileData.projectId}`)
    }

    if(isRescan) {
        let hasUnfinishedScan;
        try {
            hasUnfinishedScan = await scanManager.hasUnfinishedScan(projectUUID as string);
        }
        catch(errMessage) {
            utils.prompt.showWarningMessage(String(errMessage));
            return;
        }

        if(hasUnfinishedScan) {
            utils.prompt.showWarningMessage("有未完成的扫描。");
            return;
        }

        vscode.window.showInformationMessage(`重新扫描项目 ${workspaceFolder.name}?`,'是','关闭')
        .then(select => {
            if(select === '是') {
                logger.info('[scan] rescan. xcalscan.conf content: ' + JSON.stringify(scanConfigFileData));

                scanManager.start({
                    context, 
                    projectUUID: projectUUID as string, 
                    projectPath: scanConfigFileData.projectPath
                });

                configurationManager.updateLinkedProjectId(scanConfigFileData.projectId, workspaceFolder as vscode.WorkspaceFolder);
            }
        });
    } else {
        logger.info('[scan] start creating a new project.');
        vscode.commands.executeCommand('xcalscan.createProject', workspaceFolder.name, workspaceFolder.uri.fsPath);
    }
}

const basicValidation = () : boolean | undefined => {
    const xcalclientHome = configurationManager.getConfiguration().clientPath;

    if(!userManager.isLogin()){
        utils.prompt.showWarningMessage('请先登录。');
        vscode.commands.executeCommand('xcalscan.login');
        return;
    }

    if(!xcalclientHome){
        utils.prompt.showErrorMessage('请先设置Xcalscan客户端路径');
        return;
    }

    if(globalManager.clientIsRunning) {
        utils.prompt.showWarningMessage("项目正在扫描...");
        return;
    }

    return true;
}

const getWorkspaceFolder = (
    mainTreeView: vscode.TreeView<ProjectTreeNode | undefined>, 
    projectPath?: vscode.Uri | string
) : vscode.WorkspaceFolder | undefined => {

    let workspaceFolder: vscode.WorkspaceFolder | undefined = undefined;
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if(!workspaceFolders) {
        utils.prompt.showWarningMessage("请打开要扫描的项目");
        return;
    }

    if(workspaceFolders.length === 1) {
        workspaceFolder = workspaceFolders[0];

    } else if(projectPath) {
        const _path = projectPath instanceof vscode.Uri ? projectPath.fsPath : projectPath;

        workspaceFolder = vsDocumentManager.getWorkspaceFolder(_path);

        if(workspaceFolder === undefined) {
            utils.prompt.showWarningMessage("请选择项目根目录");
            return;
        }

    } else {
        if(mainTreeView.selection && mainTreeView.selection.length > 0) {
            const selection = mainTreeView.selection[0];
            if(selection?.nodeType === ProjectTreeNodeType.PROJECT) {
                workspaceFolder = vsDocumentManager.getWorkspaceFolder(selection.path);
            } else {
                utils.prompt.showWarningMessage("请选择项目根目录");
                return;
            }
        } else {
            utils.prompt.showWarningMessage("请先选择要扫描的项目");
            return;
        }
    }

    if(workspaceFolder === undefined) {
        utils.prompt.showErrorMessage("没有找到要扫描的项目");
        return;
    }

    return workspaceFolder;
}