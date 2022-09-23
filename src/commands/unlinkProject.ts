import * as vscode from 'vscode';
import utils from '../utils';
import globalManager from '../dataManager/globalManager';
import configurationManager from '../dataManager/configurationManager';
import { ProjectTreeNode, ProjectTreeNodeType } from '../model/projectTreeNode';
import vsDocumentManager from '../dataManager/vsDocumentManager';

export function unlinkProject(mainTreeView: vscode.TreeView<ProjectTreeNode | undefined>){
    let workspaceFolder: vscode.WorkspaceFolder | undefined = undefined;
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if(!workspaceFolders) {
        utils.prompt.showWarningMessage("请打开要扫描的项目");
        return;
    }

    if(workspaceFolders.length === 1) {
        workspaceFolder = workspaceFolders[0];

    } else if(mainTreeView.selection && mainTreeView.selection.length > 0) {
        const selection = mainTreeView.selection[0];
        if(selection?.nodeType === ProjectTreeNodeType.PROJECT) {
            //Select root node
            let path = selection.path;
            workspaceFolder = vsDocumentManager.getWorkspaceFolder(path);
        } else {
            //Select child node
            utils.prompt.showWarningMessage('请选择项目根目录');
            return;
        }
    } else {
        utils.prompt.showWarningMessage('请选择要解除关联的项目');
        return;
    }

    vscode.window.showInformationMessage(`确定要将项目 ${workspaceFolder?.name} 和它的扫描结果取消关联吗?`,'确定','关闭')
        .then(async select => {
            if(select === '确定') {
                globalManager.setIsDsrViewInWhenContext(false);
                globalManager.setIsShowDsrButtonInWhenContext(false);

                await configurationManager.updateLinkedProjectId(undefined, workspaceFolder!);
                vscode.commands.executeCommand('xcalscan.refreshMainTree');
            }
        });
}
