 import * as vscode from 'vscode';
 
 export async function selectCommitId(projectId: string, scanTaskId: string, commitId: string) { 
    vscode.commands.executeCommand('xcalscan.updateIssueTreeByCommitId', projectId, scanTaskId, commitId).then(data => {
        vscode.commands.executeCommand('xcalscan.refreshIssueTree');
    });
 }