import * as vscode from 'vscode';
import * as path from 'path';
import userManager from '../../dataManager/userManager';
import configurationManager from '../../dataManager/configurationManager';
import projectTreeManager from '../../dataManager/projectTreeManager';
import { ProjectTreeNode, defaultNode, ProjectTreeNodeType } from '../../model/projectTreeNode';

export default class MainTreeDataProvider implements vscode.TreeDataProvider<ProjectTreeNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeNode | undefined> = new vscode.EventEmitter<ProjectTreeNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ProjectTreeNode | undefined> = this._onDidChangeTreeData.event;

    private context: vscode.ExtensionContext;
    private nodeList: ProjectTreeNode[] = [];
    private isLoading: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ProjectTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.label === 'notOpenProject') {
            return {
                label: '请在vscode中打开要扫描的项目',
                collapsibleState: vscode.TreeItemCollapsibleState.None
            };
        }

        if (element.label === 'notServerAddress') {
            return {
                label: '请设置服务器地址',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: 'xcalscan.setServer',
                    title: ''
                }
            };
        }

        if (element.label === 'notClientPath') {
            return {
                label: '请设置Xcalscan客户端路径',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: 'xcalscan.setClient',
                    title: ''
                }
            };
        }

        if (element.label === 'notSignIn') {
            return {
                label: '登录到xcalscan',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: 'xcalscan.login',
                    title: ''
                }
            };
        }

        if (element.label === 'isLoading') {
            return {
                label: '数据加载中...',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                iconPath: {
                    light: path.join(__dirname, '..', 'resources', 'light', 'loading.gif'),
                    dark: path.join(__dirname, '..', 'resources', 'dark', 'loading.gif')
                },
                command: undefined
            };
        }

        return {
            label: element.label,
            tooltip: element.tooltip,
            description: element.description,
            collapsibleState: element.nodeType === ProjectTreeNodeType.FILE ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: element.iconPath,
            command: element.nodeType === ProjectTreeNodeType.FILE ? element.command : undefined,
            contextValue: element.projectId && ProjectTreeNodeType[element.nodeType]
        };
    }

    async getChildren(element?: ProjectTreeNode): Promise<ProjectTreeNode[]> {
        if(!vscode.workspace.workspaceFolders) {
            return [
                new ProjectTreeNode(Object.assign(defaultNode, {
                    label: 'notOpenProject'
                }))
            ];
        }

        if (!configurationManager.isExistServerAddress()) {
            return [
                new ProjectTreeNode(Object.assign(defaultNode, {
                    label: 'notServerAddress'
                }))
            ];
        }

        if(!configurationManager.getConfiguration().clientPath){
            return [
                new ProjectTreeNode(Object.assign(defaultNode, {
                    label: 'notClientPath'
                }))
            ];
        }

        if (!userManager.isLogin()) {
            return [
                new ProjectTreeNode(Object.assign(defaultNode, {
                    label: 'notSignIn'
                }))
            ];
        }

        if(this.isLoading) {
            return [
                new ProjectTreeNode(Object.assign(defaultNode, {
                    label: 'isLoading'
                }))
            ];
        }

        if(element === undefined) {
            this.nodeList = [];
            this.nodeList = await projectTreeManager.getProjectNodes();
        } else if(element.nodeType === ProjectTreeNodeType.PROJECT) {
            if(element.projectId) {
                this.nodeList = projectTreeManager.getRootNodes(element.projectId);
            } else {
                this.nodeList = [];
            }
        } else {
            await projectTreeManager.initializationData({
                projectId: element.projectId,
                projectName: element.projectName,
                scanTaskId: element.scanTaskId, 
                scanFileId: element.fileId
            });
            this.nodeList = projectTreeManager.getChildrenNodes(element);
        }

        return this.nodeList;
    }

    getParent(element?: ProjectTreeNode): vscode.ProviderResult<ProjectTreeNode> {
        return null;
    }

    public clear(): void {
        this.isLoading = false;
        this.nodeList = [];
        projectTreeManager.dispose();
    }

    public setLoading(): void {
        this.isLoading = true;
    }

    public cancelLoading(): void {
        this.isLoading = false;
    }
}