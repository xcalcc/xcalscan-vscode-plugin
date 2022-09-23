import * as vscode from 'vscode';
import common from '../common';
import IScanFile from '../model/scanFile';
import fileService from '../service/fileService';
import configurationManager from './configurationManager';
import { ProjectTreeNode, IProjectTreeData, ProjectTreeNodeType } from '../model/projectTreeNode';
import IIssueSummary from '../model/issueSummary';

interface IScanFileResult {
    projectId: string,
    projectName?: string,
    scanTaskId: string,
    /**
     * Store all node data for the full directory tree
     */
    projectTreeList: Array<ProjectTreeNode>
}

interface IProjectSummary {
    projectId: string,
    summaryData: IIssueSummary
}

class ProjectTreeManager implements vscode.Disposable {
    private SCAN_FILE_PAGING_SIZE = 100;

    private scanFileResultList: Array<IScanFileResult> = [];
    private scanSummaryList: Array<IProjectSummary> = [];

    /**
     * Load the data for the directory tree
     *
     */
    public async initializationData({projectId, projectName, scanTaskId, scanFileId, currentPage = 1}: { 
        projectId: string,
        projectName?: string,
        scanTaskId: string, 
        scanFileId?: string,
        currentPage?: number
    }){
        const data = await this.getScanFileList({scanTaskId, scanFileId, currentPage});

        const totalPages = data.totalPages;
        const dataList = data.content || [];
        currentPage = data.number + 1;

        const scanFileResult = this.scanFileResultList.find(x => x.projectId === projectId && x.scanTaskId === scanTaskId);
        const projectTreeList: ProjectTreeNode[] = scanFileResult?.projectTreeList || [];

        let relativePath: string;
        let folderList: string[];
        let splitWord: string;

        let item: IScanFile;
        for (item of dataList) {
            relativePath = item.projectRelativePath;
            splitWord = relativePath.indexOf('/') > -1 ? '/' : '\\';
            folderList = relativePath.split(splitWord);

            let isFileExist = projectTreeList.findIndex(x => x.fileId === item.id) > -1;

            if (isFileExist) continue;
            if (relativePath === '/') continue;
            if (relativePath.indexOf('usr/') === 0) continue;
            if (relativePath.indexOf('.') === 0) continue;

            let node: IProjectTreeData = {
                label: folderList[folderList.length - 1],
                projectId,
                projectName,
                scanTaskId,
                path: relativePath,
                parentPath: item.parentPath === '/' ? undefined : item.parentPath,
                fileId: item.id,
                nodeType: item.type === 'FILE' ? ProjectTreeNodeType.FILE : ProjectTreeNodeType.FOLDER,
                issueTotalOfFile: 0
            };

            projectTreeList.push(new ProjectTreeNode(node));
        }

        if(!scanFileResult) {
            this.scanFileResultList.push({
                projectId,
                projectName,
                scanTaskId,
                projectTreeList
            });
        }

        if(currentPage < totalPages){
            currentPage++;
            await this.initializationData({projectId, projectName, scanTaskId, scanFileId, currentPage});
        }
    }

    /**
     * Gets the root elements of the explorer
     * Use the list of project in the workspace as the root element
     */
    public async getProjectNodes(): Promise<ProjectTreeNode[]> {
        let list: ProjectTreeNode[] = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if(workspaceFolders) {
            for(let folder of workspaceFolders) {
                const projectData = await configurationManager.getLocalProjectData(folder);

                const projectSummaryData = this.scanSummaryList.find(v => v.projectId === projectData.projectUUID);
                const scanFileResult = this.scanFileResultList.find(v => v.projectId === projectData.projectUUID);

                const node: IProjectTreeData = {
                    label: folder.name,
                    projectId: projectData.projectUUID,
                    projectKey: projectData.projectKey,
                    projectName: scanFileResult?.projectName,
                    scanTaskId: scanFileResult?.scanTaskId || '',
                    path: folder.uri.path,
                    parentPath: undefined,
                    fileId: '',
                    nodeType: ProjectTreeNodeType.PROJECT,
                    issueTotalOfFile: Number(projectSummaryData?.summaryData.issuesCount) || 0
                };

                list.push(new ProjectTreeNode(node));
            }
        }
        return list;
    }

    /**
     * Gets the root elements of the directory tree
     */
    public getRootNodes(projectId: string): ProjectTreeNode[] {
        let list: ProjectTreeNode[] = [];
        const scanFileResult = this.scanFileResultList.find(x => x.projectId === projectId);

        if(scanFileResult) {
            list = scanFileResult.projectTreeList.filter((x: ProjectTreeNode) => !x.parentPath);
            this.sortDirectoryTree(list);
        }

        return list;
    }

    /**
     * Gets the children elements of the directory tree
     *
     * @param projectId The project id.
     * @param node The ProjectTreeNode object of the tree.
     */
    public getChildrenNodes(node: ProjectTreeNode): ProjectTreeNode[] {
        let list: ProjectTreeNode[] = [];
        const scanFileResult = this.scanFileResultList.find(x => x.projectId === node.projectId);

        if(scanFileResult) {
            list = scanFileResult.projectTreeList.filter((x: ProjectTreeNode) => x.parentPath === node.path);
            this.sortDirectoryTree(list);
        }

        return list;
    }

    private sortDirectoryTree(list: ProjectTreeNode[]) {
        list.sort((a: ProjectTreeNode, b: ProjectTreeNode) => {
            return a.label.localeCompare(b.label);
        });

        list.sort((a: ProjectTreeNode, b: ProjectTreeNode) => {
            if(a.nodeType === b.nodeType) {
                return 0;
            }
            return Number(a.nodeType) > Number(b.nodeType) ? 1 : -1;
        });

        return list;
    }

    private async getScanFileList({scanTaskId, scanFileId, currentPage}: { 
        scanTaskId: string, 
        scanFileId?: string,
        currentPage: number
    }) {
        return fileService.getDirectoryTree({
            scanTaskId,
            types: ['DIRECTORY', 'FILE'],
            scanFileIds: scanFileId ? [scanFileId] : undefined,
            depth: 1,
            page: currentPage - 1,
            size: this.SCAN_FILE_PAGING_SIZE
        })
        .then(response => {
            return response.data || {};
        })
        .catch(err => {
            return Promise.reject(common.getApiMessage(err));
        });
    }

    /**
     * Cache the summary data
     *
     */
    public setSummaryData(projectId: string, summaryData: IIssueSummary) {
        let data = this.scanSummaryList.find(x => x.projectId === projectId);

        if(data) {
            data['summaryData'] = summaryData;
        } else {
            this.scanSummaryList.push({
                projectId,
                summaryData
            });
        }
    }

    /**
     * Clear cached data of the previous scan
     *
     */
    public deleteProjectData(projectId: string) {
        this.scanFileResultList = this.scanFileResultList.filter(x => x.projectId !== projectId);
        this.scanSummaryList = this.scanSummaryList.filter(x => x.projectId !== projectId);
    }

    /**
     * Dispose object
     *
     */
    public dispose(): void {
        this.scanFileResultList = [];
        this.scanSummaryList = [];
    }
}

export default new ProjectTreeManager();