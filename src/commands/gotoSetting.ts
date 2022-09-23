import * as vscode from 'vscode';

export async function gotoSetting(){
    vscode.commands.executeCommand('workbench.action.openSettings', 'xcalscan');
}