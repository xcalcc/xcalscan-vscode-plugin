import * as vscode from 'vscode';
import globalManager from "../dataManager/globalManager";

// switch project tree view or DSR view
export async function toggleDsrView(isDsrView: boolean){
    globalManager.setIsDsrViewInWhenContext(isDsrView);

    await vscode.commands.executeCommand('xcalscan.clearIssueTree');
    await vscode.commands.executeCommand('xcalscan.refreshIssueTree');
}