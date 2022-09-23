import * as vscode from 'vscode';
import utils from '../utils';
import vsDocumentManager from '../dataManager/vsDocumentManager';

export async function selectIssueFile(projectId: string, scanTaskId: string, scanFileId: string, scanFileRelativePath: string){
    // open file
    const localPath = vsDocumentManager.searchFilePosition(scanFileRelativePath);
    if(localPath) {
        vsDocumentManager.goToDefinition(localPath, 0, undefined);
    } else {
        utils.prompt.showErrorMessage(`The file does not exist in the current workspace: ${scanFileRelativePath}`);
    }

    // display issue tree
    vscode.commands.executeCommand('xcalscan.updateIssueTreeByFileId', projectId, scanTaskId, scanFileId).then(data => {
        vscode.commands.executeCommand('xcalscan.refreshIssueTree');
    });
}