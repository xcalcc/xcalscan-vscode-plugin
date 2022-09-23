import * as vscode from 'vscode';

class GlobalManager {

    public context?: vscode.ExtensionContext;
    public clientIsRunning?: boolean;

    public setContext(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public setClientIsRunning(isRunning: boolean) {
        this.clientIsRunning = isRunning;
    }

    /*
     * use the setContext command add a 'when clause' context of isDsrView.
     */
    public setIsDsrViewInWhenContext(isDsrView: boolean) {
        vscode.commands.executeCommand('setContext', 'xcalscan.isDsrView', isDsrView);
    }

    /*
     * use the setContext command add a 'when clause' context of isShowDsrButton.
     */
    public setIsShowDsrButtonInWhenContext(isShow: boolean) {
        vscode.commands.executeCommand('setContext', 'xcalscan.isShowDsrButton', isShow);
    }
}

export default new GlobalManager();