import * as vscode from 'vscode';
import logger from '../utils/logger';
import utils from '../utils';
import globalManager from './globalManager';
import configurationManager from './configurationManager';
import userManager from './userManager';

class PreprocessManager {
    private getXcalServerAddressWithoutPort() {
        return configurationManager.getConfiguration().serverAddressWithoutPort;
    }
    private getXcalServerPort() {
        return configurationManager.getConfiguration().serverPort;
    }
    private getXcalClientPath() {
        return configurationManager.getConfiguration().clientPath;
    }

    /*
     *  Preprocessing before scanning
     */
    public startPreprocess({context, projectPath}: {
        context: vscode.ExtensionContext,
        projectPath: string
    }): Promise<boolean> {
        logger.info('start preprocess - xcalclient', true);

        const xcalServerAddressWithoutPort = this.getXcalServerAddressWithoutPort();
        const xcalServerPort = this.getXcalServerPort();
        const xcalClientDirPath = this.getXcalClientPath();
        const userInfo = userManager.getUserInfo(context);

        const exeFileName = utils.os.isWindows() ? 'client' : './client';

        const commandArgs: string[] = [];
        commandArgs.push(`-h ${xcalServerAddressWithoutPort}`);
        commandArgs.push(`-p ${xcalServerPort}`);
        commandArgs.push(`-u ${userInfo.userName}`);
        commandArgs.push(`--psw ${userInfo.password}`);
        commandArgs.push(`-s ${projectPath}`);
        commandArgs.push('--call-from V');

        logger.info('xcalclient command: ' + exeFileName + ' ' + commandArgs.join(' '));
        logger.info('xcalclient cwd: ' + xcalClientDirPath);

        return new Promise((resolve, reject) => {
            globalManager.setClientIsRunning(true);

            utils.childProcess.executeCommand(exeFileName, commandArgs.join(' ').split(' '), {
                cwd: xcalClientDirPath,
                shell: true
            })
            .then(response => {
                const scanTaskId = this.getScanTaskId(response);
                logger.info('run xcalclient completed!');
                logger.info('scanTaskId: ' + scanTaskId);
                resolve(true);
            })
            .catch(err => {
                logger.error('run xcalclient failed');
                logger.error(err);
                reject("扫描失败: 执行编译失败!");
            })
            .finally(() => {
                globalManager.setClientIsRunning(false);
            });
        });
    }

    private getScanTaskId(xcalclientStdout: string): string | undefined {
        let scanTaskId;
        let scanTaskInfo = '';
        const stdoutArray = String(xcalclientStdout).match(/\[FLOW\]{.+?}/g);
        if(stdoutArray) {
            for(let info of stdoutArray) {
                if(info.indexOf('scanTaskId') > -1) {
                    scanTaskInfo = info.replace('[FLOW]', '');
                    break;
                }
            }
        }

        if(utils.json.isSingleJsonString(scanTaskInfo)) {
            const scanTaskData = JSON.parse(scanTaskInfo);
            scanTaskId = scanTaskData.scanTaskId;
        }
        return scanTaskId;
    }
}

export default new PreprocessManager();