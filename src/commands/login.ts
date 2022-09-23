import * as vscode from 'vscode';
import utils from '../utils';
import common from '../common';
import globalManager from '../dataManager/globalManager';
import userManager from '../dataManager/userManager';
import xcalscanManager from '../dataManager/xcalscanManager';

export async function login(context: vscode.ExtensionContext){
    if(userManager.isLogin()){
        logout();
        return;
    }

    const userName: string | undefined = await vscode.window.showInputBox({
        prompt: '请输入用户名',
        ignoreFocusOut: true,
        validateInput: (s: string): string | undefined => s && s.trim() ? undefined : '用户名不能为空',
    });

    if(userName === undefined) {
        return;
    }

    const password: string | undefined = await vscode.window.showInputBox({
        prompt: '请输入密码',
        password: true,
        ignoreFocusOut: true,
        validateInput: (s: string): string | undefined => s ? undefined : '密码不能为空',
    });

    if(userName && password) {
        userManager
            .login(userName, password)
            .then(async (data: {tokenType: string, accessToken: string}) => {
                await userManager.saveUserInfo(context ,userName, password);
                await userManager.saveToken(data.tokenType, data.accessToken);

                utils.prompt.showInformationMessage('登录成功!');
                xcalscanManager.loadScanResultsForTree(context, true);
            })
            .catch(err => {
                utils.prompt.showErrorMessage('登录失败:' + common.getApiMessage(err));
            });
    }
}

function logout() {
    vscode.window.showInformationMessage(`您已登录, 可以点击下面的按钮退出登录。`,'退出登录','关闭')
        .then(async select => {
            if(select === '退出登录') {
                globalManager.setIsDsrViewInWhenContext(false);
                globalManager.setIsShowDsrButtonInWhenContext(false);

                await userManager.clearToken();
                utils.prompt.showInformationMessage('账号已退出!');
                vscode.commands.executeCommand('xcalscan.refreshMainTree');
            }
        });
}