import * as vscode from 'vscode';
import utils from '../utils';
import configurationManager from '../dataManager/configurationManager';

export async function setServer(){
    const serverAddress: string | undefined = await vscode.window.showInputBox({
        prompt: '请输入Xcalscan的服务器地址 （例如: http://127.0.0.1)',
        ignoreFocusOut: true,
        validateInput: (s: string): string | undefined => s && s.trim() ? undefined : '服务器地址不能为空'
    });

    if(serverAddress) {
        if(serverAddress.indexOf('http') !== 0) {
            utils.prompt.showErrorMessage('请输入有效的URL地址');
            return;
        }

        await configurationManager.setServerAddress(serverAddress);

        utils.prompt.showInformationMessage('服务器地址设置成功!');
        vscode.commands.executeCommand('xcalscan.refreshMainTree');
    }
}