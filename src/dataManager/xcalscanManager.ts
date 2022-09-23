import * as vscode from 'vscode';
import ruleManager from '../dataManager/ruleManager';
import configurationManager from '../dataManager/configurationManager';
import userManager from '../dataManager/userManager';

class XcalscanManager {
    public async loadScanResultsForTree(context: vscode.ExtensionContext, isForceRefresh?: boolean) {
        vscode.commands.executeCommand('xcalscan.setLoadingOfTree');

        if(isForceRefresh === true) {
            await ruleManager.clearCache(context);
        }

        if(!userManager.isLogin()) {
            vscode.commands.executeCommand('xcalscan.cancelLoadingOfTree');
            return;
        }

        //Get the scan results of the current project
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if(workspaceFolders) {
            for(let folder of workspaceFolders) {
                const localProjectData = await configurationManager.getLocalProjectData(folder);
                if(localProjectData.projectUUID) {
                    vscode.commands.executeCommand('xcalscan.viewScanResult', localProjectData.projectUUID, false);
                } else  {
                    vscode.commands.executeCommand('xcalscan.cancelLoadingOfTree');
                }
            }
        } else {
            vscode.commands.executeCommand('xcalscan.cancelLoadingOfTree');
        }
    }
}

export default new XcalscanManager();