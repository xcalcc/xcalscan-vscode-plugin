import * as vscode from 'vscode';
import IssueTreeNode from '../../model/issueTreeNode';
import IIssueTracePath from '../../model/issueTracePath';
import IssueTreeNodeType from '../../model/issueTreeNodeType';
import IssueTreeViewType from '../../model/issueTreeViewType';
import issueTreeManager from '../../dataManager/issueTreeManager';

export default class FavoriteTreeDataProvider implements vscode.TreeDataProvider<IssueTreeNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueTreeNode | undefined> = new vscode.EventEmitter<IssueTreeNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<IssueTreeNode | undefined> = this._onDidChangeTreeData.event;

    private context: vscode.ExtensionContext;
    private projectId: string = '';
    private nodeList: IssueTreeNode[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: IssueTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let collapsibleState = undefined;

        if(element.nodeType === IssueTreeNodeType.TRACE_PATH_NODE || 
            element.nodeType === IssueTreeNodeType.PAGING ||
            element.nodeType === IssueTreeNodeType.NO_DATA) 
        {
            collapsibleState = vscode.TreeItemCollapsibleState.None;
        } else {
            collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }

        return {
            id: element.uuid,
            label: element.label,
            tooltip: element.tooltip,
            description: element.description,
            collapsibleState,
            iconPath: element.iconPath,
            command: element.command,
            contextValue: undefined
        };
    }

    async getChildren(element?: IssueTreeNode | undefined): Promise<IssueTreeNode[]> {
        if(!this.projectId){
            return [];
        }

        if(element === undefined) {
            this.nodeList = await issueTreeManager.getIssueListForFavoriteView(this.projectId);
        } 
        else if(element.nodeType === IssueTreeNodeType.ISSUE && element.issueData) {
            this.nodeList = await issueTreeManager.getTracePathList(this.context, element.issueData, IssueTreeViewType.normal);
        } 
        else if(element.nodeType === IssueTreeNodeType.TRACE_PATH && element.issueData) {
            let issueTraceInfo: IIssueTracePath = element.currentNodeData as IIssueTracePath;
            this.nodeList = issueTreeManager.getTracePathNodeList(issueTraceInfo, element.issueData);
        } 
        else {
            this.nodeList = [];
        }

        return this.nodeList;
    }

    public setContent(projectId: string) {
        this.projectId = projectId;
    }
}