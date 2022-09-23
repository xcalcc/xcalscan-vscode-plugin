import * as vscode from 'vscode';
import * as path from 'path';
import configurationManager from '../../dataManager/configurationManager';
import dsrTreeManager from '../../dataManager/dsrTreeManager';
import DsrTreeNode from '../../model/dsrTreeNode';
import DsrTreeNodeType from '../../model/dsrTreeNodeType';

export default class DsrTreeDataProvider implements vscode.TreeDataProvider<DsrTreeNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<DsrTreeNode | undefined> = new vscode.EventEmitter<DsrTreeNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<DsrTreeNode | undefined> = this._onDidChangeTreeData.event;

    private context: vscode.ExtensionContext;
    private nodeList: DsrTreeNode[] = [];
    private isLoading: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DsrTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.label === 'notOpenProject') {
            return {
                label: '请在vscode中打开要扫描的项目',
                collapsibleState: vscode.TreeItemCollapsibleState.None
            };
        }

        if (element.nodeType === DsrTreeNodeType.LOADING) {
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
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            iconPath: element.iconPath,
            command: element.command,
            contextValue: undefined
        };
    }

    async getChildren(element?: DsrTreeNode): Promise<DsrTreeNode[]> {
        if(!vscode.workspace.workspaceFolders) {
            return [];
        }

        if(this.isLoading) {
            return [
                new DsrTreeNode(DsrTreeNodeType.LOADING, '')
            ];
        }

        if(element === undefined) {
            // TODO: no support for VSCODE to open multiple projects
            const currentFolder = vscode.workspace.workspaceFolders[0];
            const projectData = await configurationManager.getLocalProjectData(currentFolder);

            this.nodeList = await dsrTreeManager.getScanTaskLogData({
                projectUUID: projectData.projectUUID,
                currentPage: 1
            });
        }

        return this.nodeList;
    }

    getParent(element?: DsrTreeNode): vscode.ProviderResult<DsrTreeNode> {
        return null;
    }

    public clear(): void {
        this.isLoading = false;
        this.nodeList = [];
        dsrTreeManager.dispose();
    }

    public setLoading(): void {
        this.isLoading = true;
    }

    public cancelLoading(): void {
        this.isLoading = false;
    }
}