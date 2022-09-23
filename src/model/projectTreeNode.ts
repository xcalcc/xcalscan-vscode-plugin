import * as vscode from 'vscode';
import * as path from 'path';

export interface IProjectTreeData {
    label: string,
    projectId: string,
    projectKey?: string,
    projectName?: string,
    scanTaskId: string,
    path: string,
    parentPath?: string,
    fileId: string,
    nodeType: ProjectTreeNodeType,
    issueTotalOfFile: number
}

export enum ProjectTreeNodeType{
    PROJECT,
    FOLDER,
    FILE
}

export const defaultNode: IProjectTreeData = {
    label: '',
    projectId: '',
    projectName: '',
    scanTaskId: '',
    path: '',
    parentPath: '',
    fileId: '',
    nodeType: ProjectTreeNodeType.PROJECT,
    issueTotalOfFile: 0
};

export class ProjectTreeNode {
    constructor(private data: IProjectTreeData) { }

    public get label(): string {
        return this.data.label;
    }

    public get tooltip(): string | undefined {
        return this.data.path;
    }

    public get description(): string | undefined {
        let result: string | undefined = undefined;

        switch(this.data.nodeType) {
            case ProjectTreeNodeType.PROJECT:
                result = this.data.projectId 
                            ? (this.data.projectName ? `${this.data.projectName} (${this.data.issueTotalOfFile})` : '扫描失败')
                            : '未扫描';
                break;
            case ProjectTreeNodeType.FILE:
                //result = this.data.issueTotalOfFile.toString();
                break;
        }

        return result;
    }

    public get projectId(): string {
        return this.data.projectId;
    }

    public get projectKey(): string | undefined {
        return this.data.projectKey;
    }

    public get projectName(): string | undefined {
        return this.data.projectName;
    }

    public get scanTaskId(): string {
        return this.data.scanTaskId;
    }

    public get fileId(): string {
        return this.data.fileId;
    }

    public get path(): string {
        return this.data.path;
    }

    public get parentPath(): string | undefined {
        return this.data.parentPath;
    }

    public get nodeType(): ProjectTreeNodeType {
        return this.data.nodeType;
    }

    public get command(): vscode.Command {
        return {
            title: 'Select File',
            command: 'xcalscan.selectIssueFile',
            arguments: [this.data.projectId, this.data.scanTaskId, this.data.fileId, this.data.path]
        };
    }

    public get iconPath() {
        let iconName: string;
        switch(this.nodeType) {
            case ProjectTreeNodeType.FILE:
                iconName = 'code.png';
                break;
            case ProjectTreeNodeType.FOLDER:
                iconName = 'folder.svg';
                break;
            case ProjectTreeNodeType.PROJECT:
                iconName = 'project.png';
                break;
        }

        return {
            light: path.join(__dirname, '..', 'resources', 'light', iconName),
            dark: path.join(__dirname, '..', 'resources', 'dark', iconName)
        };
    }
}