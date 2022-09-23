import * as FormData from 'form-data';
import * as path from 'path';
import * as fs from 'fs';
import logger from '../utils/logger';
import utils from '../utils';
import configurationManager from './configurationManager';
import userManager from './userManager';
import fileService from '../service/fileService';
import scanService from '../service/scanService';

interface UploadFile {
    filename:string,
    fileId: string
}

/*
    NOTICE: This file is no longer useful and is now using XcalClient
*/
class AgentManager {

    private getXcalAgentPath() {
        return configurationManager.getConfiguration().clientPath;
    }

    private getWorkDirPath(projectId: string) {
        return path.join(this.getXcalAgentPath(), "workdir", "jobs", projectId);
    }

    /*
     *  Start agent
     */
    public async startAgent({projectId, projectPath, buildPath, scanTaskId, scanConfig, allowUploadSourceCode}: {
        projectId: string,
        projectPath: string,
        buildPath: string,
        scanTaskId: string,
        scanConfig: object,
        allowUploadSourceCode: boolean
    }): Promise<boolean> {
        logger.info('start agent', true);

        return new Promise(async (resolve, reject) => {
            try{
                await this.startPreprocess({projectId, projectPath, buildPath, scanConfig, allowUploadSourceCode});
                const uploadFiles: UploadFile[] = await this.uploadPreprocessFiles(projectId, allowUploadSourceCode);
                await this.startScanPipeline(projectId, uploadFiles, scanTaskId, projectPath, buildPath, scanConfig, allowUploadSourceCode);
                resolve(true);
            }
            catch(err) {
                reject(err);
            }
        });
    }

    /*
     *  Preprocessing before scanning
     */
    private startPreprocess({projectId, projectPath, buildPath, scanConfig, allowUploadSourceCode}: {
        projectId: string,
        projectPath: string,
        buildPath: string,
        scanConfig: object,
        allowUploadSourceCode: boolean
    }): Promise<boolean> {
        logger.info('start preprocess - xcal-agent', true);

        const agentDirPath = this.getXcalAgentPath();
        const workDirPath = this.getWorkDirPath(projectId);

        const agentFileName = utils.os.isWindows() ? 'xcal-agent' : './xcal-agent';
        const agentExecDirPath = `${agentDirPath}/tools`;
        const tempConfigFilePath = path.join(workDirPath, `project.conf`);


        let agentCommandArgs:string[] = [];

        allowUploadSourceCode 
            ? agentCommandArgs.push('--all') 
            : agentCommandArgs.push('-p -cfi');

        agentCommandArgs.push(`-pc ${tempConfigFilePath}`);
        agentCommandArgs.push(`-pid ${projectId}`);
        agentCommandArgs.push(`--build-path ${buildPath}`);
        agentCommandArgs.push(`--project-path ${projectPath}`);

        const projectConfig = {
            projectId,
            projectPath,
            buildPath,
            scanConfig
        };

        logger.info('client command:' + agentFileName + ' ' + agentCommandArgs.join(' '));
        logger.info('client cwd:' + agentExecDirPath);
        logger.info('config file:' + tempConfigFilePath);
        logger.info(projectConfig);

        utils.file.mkdir(workDirPath);

        if(fs.existsSync(tempConfigFilePath)) {
            fs.writeFileSync(tempConfigFilePath, JSON.stringify(projectConfig));
        } else {
            fs.appendFileSync(tempConfigFilePath, JSON.stringify(projectConfig));
        }

        return new Promise((resolve, reject) => {
            utils.childProcess.executeCommand(agentFileName, agentCommandArgs.join(' ').split(' '), {
                cwd: agentExecDirPath,
                shell: true
            })
            .then(response => {
                resolve(true);
            })
            .catch(err => {
                logger.error('run xcal-agent failed');
                logger.error(err);
                reject("扫描失败: 执行编译失败!");
            });
        });
    }

    /*
     *  Upload files to server source_code.zip,fileinfo.json,preprocess.tar.gz
     */
    private async uploadPreprocessFiles(projectId: string, allowUploadSourceCode: boolean) : Promise<UploadFile[]>{
        let files: UploadFile[] = [];
        let workDir = this.getWorkDirPath(projectId);

        logger.info('upload preprocess generated files', true);
        logger.info('agentWorkDir:' + workDir);
        logger.info('allowUploadSourceCode:' + allowUploadSourceCode);

        if(allowUploadSourceCode){
            let source_id = await this.uploadFile(`${workDir}/source_code.zip`);
            
            if(!source_id){
                return Promise.reject('客户端文件无法上传');
            }

            files.push({
                filename: 'source_code.zip',
                fileId: source_id
            });

            this.modifyFileinfo(path.join(workDir, 'fileinfo.json'), source_id);
        }

        let fileinfo_id = await this.uploadFile(`${workDir}/fileinfo.json`);
        let preprocess_id = await this.uploadFile(`${workDir}/preprocess.tar.gz`);

        if(!fileinfo_id || !preprocess_id){
            return Promise.reject('客户端文件无法上传');
        }

        files.push({
            filename: 'fileinfo.json',
            fileId: fileinfo_id
        });
        files.push({
            filename: 'preprocess.tar.gz',
            fileId: preprocess_id
        });

        return files;
    }

    /*
     *  Fixing file info
     */
    private modifyFileinfo(filePath: string, sourceCodeFileId: string){
        let text = fs.readFileSync(filePath).toString();
        text = text.replace(/"sourceType":\s?"agent"/, '"sourceType": "volume_upload"');
        text = text.replace(/"sourceCodeFileId": ""/, `"sourceCodeFileId": "${sourceCodeFileId}"`);

        fs.writeFileSync(filePath, text);
    }

    /*
     *  Scan task service pipeline started
     */
    private async startScanPipeline(
        projectId: string,
        uploadFiles: UploadFile[], 
        scanTaskId: string,
        projectPath: string,
        buildPath: string,
        scanConfig: object,
        allowUploadSourceCode: boolean
    ): Promise<boolean>{
        let accessToken = userManager.getToken().accessToken;

        let scanTaskData = {
            projectId: projectId,
            uploadResults: uploadFiles,
            scanFilePath: '/share/scan/' + scanTaskId,
            sourceCodePath: projectPath,
            agentType: 'offline_agent',
            preprocessPath: buildPath,
            uploadSource: allowUploadSourceCode ? 'Y' : 'N',
            scanTaskId: scanTaskId,
            configContent: {
                sourceStorageName: 'agent',
                ...scanConfig
            },
            sourceType: 'agent',
            token: accessToken,
            ...scanConfig
        };

        logger.info('start scan pipeline', true);
        logger.info('/api/scan_task_service/v2 parameter:' );
        logger.info(scanTaskData);

        return scanService
            .startScanTaskPipeline(scanTaskData)
            .then(response => {
                logger.info('/api/scan_task_service/v2 response:');
                logger.info(response.data);
                return true;
            })
            .catch(err => {
                return Promise.reject('无法在服务端开始扫描任务');
            });
    }

    /*
     *  Upload a file
     */
    private async uploadFile(filePath: string): Promise<string>{
        logger.info('upload file', true);
        logger.info('filePath:' + filePath);

        let formData = new FormData();
        const stream = fs.createReadStream(filePath);
        formData.append('upload_file', stream);
        formData.append('type', 'TEMP');

        const formHeaders = formData.getHeaders();

        return fileService.uploadFile(formData, {
            headers: {
                ...formHeaders
            }
        })
        .then(response => {
            let data = response.data || {};
            logger.info('/api/file_service/v2/file/file_info response:');
            logger.info(data);
            logger.info('upload file end');
            return data.id;
        })
        .catch(err => {
            logger.info('upload file end');
        });
    }
}

export default new AgentManager();