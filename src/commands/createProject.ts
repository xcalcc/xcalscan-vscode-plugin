import * as vscode from 'vscode';
import * as path from 'path';
import utils from '../utils';
import common from '../common';
import logger from '../utils/logger';
import { PROJECT_LANGUAGE, XCALSCAN_FILES, UPLOAD_SOURCE_CODE_DEFAULT } from '../common/constants';
import configurationManager from '../dataManager/configurationManager';
import vsDocumentManager from '../dataManager/vsDocumentManager';
import projectService from '../service/projectService';
import scanManager from '../dataManager/scanManager';
import GitManager from '../dataManager/gitManager';

interface IProjectData {
    projectName: string,
    projectId: string,
    projectPath: string,
    buildPath: string,
    uploadSource: boolean,
    scanConfig: object | undefined
}

/**
 * Create and scan project
 */
class CreateProject {
    projectData: IProjectData = {
        projectName: '',
        projectId: '',
        projectPath: '',
        buildPath: '',
        uploadSource: false,
        scanConfig: {}
    };

    /**
     * Create and scan project
     * @param projectName Project name.
     * @param projectPath Project path.
     */
    public async createAndScan(context: vscode.ExtensionContext, projectName: string, projectPath: string){
        if(!vscode.workspace.workspaceFolders) {
            utils.prompt.showWarningMessage("请打开要扫描的项目");
            return;
        }

        const workspaceFolder = vsDocumentManager.getWorkspaceFolder(projectPath);
        const scanConfigFilePath = path.resolve(projectPath, XCALSCAN_FILES.SCAN_CONFIG_FILE);

        let scanConfigFileData: any = {};
        if(!utils.file.existsSync(scanConfigFilePath)) {
            // get project config data from user input
            const isInputComplete: boolean | undefined = await this.buildProjectDataFromUserInput(projectName, projectPath);
            if(!isInputComplete) {
                utils.prompt.showWarningMessage('取消创建项目.');
                logger.info('[scan] create project cancelled.');
                return;
            }
        } else {
            // get project config data from xcalscan.conf
            scanConfigFileData = utils.file.readJsonSync(scanConfigFilePath) || {};
            this.projectData = {
                projectId: scanConfigFileData.projectId || this.generateProjectId(scanConfigFileData.projectName || workspaceFolder?.name),
                projectName: scanConfigFileData.projectName || workspaceFolder?.name,
                projectPath: scanConfigFileData.projectPath || workspaceFolder?.uri.fsPath,
                buildPath: scanConfigFileData.buildPath || workspaceFolder?.uri.fsPath,
                uploadSource: scanConfigFileData.uploadSource || UPLOAD_SOURCE_CODE_DEFAULT,
                scanConfig: scanConfigFileData.scanConfig || {},
            };
        }

        if(!scanConfigFileData.projectId || 
            !scanConfigFileData.projectName || 
            !scanConfigFileData.projectPath || 
            !scanConfigFileData.buildPath) {
            this.createOrUpdateXcalConfigFile(scanConfigFilePath, scanConfigFileData);
        }

        const postData = {
            projectId: this.projectData.projectId,
            projectName: this.projectData.projectName,
            projectConfig: {
                scanType: 'offline_agent',
                sourceStorageName: 'agent',
                sourceStorageType: 'AGENT',
                relativeSourcePath: this.projectData.projectPath,
                relativeBuildPath: this.projectData.buildPath || '/',
                uploadSource: this.projectData.uploadSource
            },
            scanConfig: this.projectData.scanConfig
        };

        projectService.createProject(postData)
            .then(async response => {
                const project = response.data || {};
                logger.info('[scan] create project successfully, project uuid: ' + project.id);

                await configurationManager.updateLinkedProjectId(project.projectId, workspaceFolder as vscode.WorkspaceFolder);

                // start scan
                scanManager.start({
                    context, 
                    projectUUID: project.id, 
                    projectPath: this.projectData.projectPath,
                });

                utils.prompt.showInformationMessage('项目创建成功, 正在扫描...');
            })
            .catch(err => {
                logger.error('[scan] create project failed, payload: ' + JSON.stringify(postData));
                utils.prompt.showErrorMessage(common.getApiMessage(err));
            });
    }

    private generateProjectId(projectName: string) {
        return utils.string.replaceSpecialChars(projectName) + utils.uuid.uuid8();
    }

    private async createOrUpdateXcalConfigFile(scanConfigFilePath: string, scanConfigFileData: any) {
        const gitManager = new GitManager(this.projectData.projectPath);
        const gitBranchName = await gitManager.getBranchName();

        const configFileData: any = {
            ...scanConfigFileData,
            ...this.projectData
        };

        if(gitBranchName && !configFileData.dsr) {
            configFileData.dsr = {
                repoPath: this.projectData.projectPath,
                repoBranch: gitBranchName
            };
        }

        utils.file.writeFileSync(scanConfigFilePath, JSON.stringify(configFileData, null, 4));
    }

    async buildProjectDataFromUserInput(projectName: string, projectPath: string): Promise<boolean | undefined> {
        let _lang: string | undefined;
        let _scanConfig: string | undefined;
        let _projectName: string | undefined;
        let _projectPath: string | undefined;
        let _buildPath: string | undefined;
        let _scanMode: string | undefined;
        
        _projectName = await vscode.window.showInputBox({
            prompt: '项目名称 (必填)',
            value: projectName,
            ignoreFocusOut: true,
            placeHolder: '请输入项目名称',
            validateInput: (s: string): string | undefined => s && s.trim() ? undefined : '项目名称不能为空',
        });

        if(_projectName === undefined) {
            return;
        }

        _lang = await vscode.window.showQuickPick(
            [PROJECT_LANGUAGE.cplus, PROJECT_LANGUAGE.java],
            {
                canPickMany: false,
                ignoreFocusOut: true,
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: '项目语言 (必选)'
            }
        );

        if(_lang === undefined) {
            return;
        }

        _projectPath = await vscode.window.showInputBox({
            prompt: '源代码路径 (必填)',
            value: projectPath,
            ignoreFocusOut: true,
            placeHolder: '请输入源代码路径',
            validateInput: (s: string): string | undefined => s && s.trim() ? undefined : '源代码路径不能为空',
        });

        if(_projectPath === undefined) {
            return;
        }

        _buildPath = await vscode.window.showInputBox({
            prompt: 'build文件路径 (非必填)',
            value: projectPath,
            ignoreFocusOut: true,
            placeHolder: '请输入build文件路径',
            validateInput: (s: string): string | undefined => undefined,
        });

        if(_buildPath === undefined) {
            return;
        }

        _scanMode = await vscode.window.showInputBox({
            prompt: '扫描模式 (非必填)',
            value: '',
            ignoreFocusOut: true,
            placeHolder: '扫描模式, 默认值为 "-single"',
            validateInput: (s: string): string | undefined => undefined,
        });

        if(_scanMode === undefined) {
            return;
        }

        _scanConfig = await vscode.window.showInputBox({
            prompt: '其它设置 (非必填)',
            value: '',
            ignoreFocusOut: true,
            placeHolder: '请输入JSON格式的字符串, 如 {"key1": "value1", "key2": "value2"}',
            validateInput: (s: string): string | undefined => {
                if(!s) {
                    return undefined;
                }

                if(!utils.json.isSingleJsonString(s)){
                    return '输入的内容不是有效的JSON格式';
                }
            },
        });

        if(_scanConfig === undefined) {
            return;
        }

        let scanConfigObj: any = {
            lang: _lang
        };

        if(_scanMode) {
            scanConfigObj.scanMode = _scanMode;
        }

        if(utils.json.isSingleJsonString(_scanConfig)){
            scanConfigObj = {
                ...scanConfigObj,
                ...JSON.parse(_scanConfig)
            };
        }

        this.projectData = {
            projectId: this.generateProjectId(_projectName),
            projectName: _projectName,
            projectPath: _projectPath,
            buildPath: _buildPath,
            uploadSource: UPLOAD_SOURCE_CODE_DEFAULT,
            scanConfig: scanConfigObj
        };

        return true;
    }
}

export const createProject: CreateProject = new CreateProject();