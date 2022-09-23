import * as vscode from 'vscode';
import utils from '../utils';
import configurationManager from '../dataManager/configurationManager';

export async function setClient(){
    const clientPath: string | undefined = await vscode.window.showInputBox({
        prompt: '请输入Xcalscan客户端路径',
        ignoreFocusOut: true,
        validateInput: (s: string): string | undefined => s && s.trim() ? undefined : '路径不能为空'
    });

    if(clientPath) {
        await configurationManager.setClientPath(clientPath);

        utils.prompt.showInformationMessage('Xcalscan客户端路径设置成功!');
        vscode.commands.executeCommand('xcalscan.refreshMainTree');
    }
}