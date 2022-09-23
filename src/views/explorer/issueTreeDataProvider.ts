import * as vscode from 'vscode';
import IssueTreeNode from '../../model/issueTreeNode';
import IIssueTracePath from '../../model/issueTracePath';
import IIssueCategory from '../../model/issueCategory';
import IIssueDsrCategory from '../../model/issueDsrCategory';
import IssueTreeNodeType from '../../model/issueTreeNodeType';
import IssueTreeViewType from '../../model/issueTreeViewType';
import issueTreeManager from '../../dataManager/issueTreeManager';

export default class IssueTreeDataProvider implements vscode.TreeDataProvider<IssueTreeNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueTreeNode | undefined> = new vscode.EventEmitter<IssueTreeNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<IssueTreeNode | undefined> = this._onDidChangeTreeData.event;

    private context: vscode.ExtensionContext;
    private viewType: number = IssueTreeViewType.normal; 
    private projectId: string = '';
    private scanTaskId: string = '';
    private fileId: string = '';
    private commitId: string = '';
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
        if(!this.fileId && !this.commitId) {
            return [];
        }

        let categoryNode;

        if(element === undefined) {
            this.nodeList = [];

            switch(this.viewType) {
                case IssueTreeViewType.dsr:
                    this.nodeList = issueTreeManager.getIssueRootNodesForDsrView();
                    break;
                
                case IssueTreeViewType.normal:
                    this.nodeList = await issueTreeManager.getIssueListForNormalView(this.context, this.projectId, this.fileId);
                    break;

                case IssueTreeViewType.ruleset:
                    this.nodeList = await issueTreeManager.getRuleSetList(this.context, this.projectId, this.fileId);
                    break;

                default:
                    break;
            }

            return this.nodeList;
        } 

        switch(element.nodeType) {
            case IssueTreeNodeType.DSR_CATEGORY:

                categoryNode = element.currentNodeData as IIssueDsrCategory;
                this.nodeList = await issueTreeManager.getIssueListForDsrView(
                    this.context, 
                    this.projectId, 
                    this.scanTaskId, 
                    categoryNode.dsrType
                );
                break;

            case IssueTreeNodeType.RULE_SET:

                categoryNode = element.currentNodeData as IIssueCategory;
                this.nodeList = issueTreeManager.getIssueLevelList(this.fileId, categoryNode.value);
                break;

            case IssueTreeNodeType.ISSUE_LEVEL:

                categoryNode = element.currentNodeData as IIssueCategory;
                this.nodeList = await issueTreeManager.getIssueRuleList(
                    this.context, 
                    this.fileId, 
                    categoryNode.ruleSetId, 
                    categoryNode.riskLevel || ''
                );
                break;

            case IssueTreeNodeType.ISSUE_RULE:

                categoryNode = element.currentNodeData as IIssueCategory;

                this.nodeList = await issueTreeManager.getIssueListForRulesetView(
                    this.context,
                    this.projectId, 
                    this.fileId, 
                    categoryNode.csvCode || '',
                    categoryNode.riskLevel || ''
                );
                break;

            case IssueTreeNodeType.ISSUE:

                if(element.issueData) {
                    this.nodeList = await issueTreeManager.getTracePathList(
                        this.context, 
                        element.issueData, 
                        this.viewType
                    );
                }
                break;

            case IssueTreeNodeType.TRACE_PATH:

                if(element.issueData) {
                    let issueTracePath: IIssueTracePath = element.currentNodeData as IIssueTracePath;
                    this.nodeList = issueTreeManager.getTracePathNodeList(issueTracePath, element.issueData);
                }
                break;

            default:
                this.nodeList = [];
                break;
        }

        return this.nodeList;
    }

    public clear() {
        this.fileId = '';
        this.commitId = '';
        issueTreeManager.dispose();
    }

    public setContentByScanFileId(projectId: string, scanTaskId: string, fileId: string) {
        this.viewType = this.viewType === IssueTreeViewType.dsr ? IssueTreeViewType.normal : this.viewType;
        this.projectId = projectId;
        this.scanTaskId = scanTaskId;
        this.fileId = fileId;

        this.commitId = '';
    }

    public setContentByCommitId(projectId: string, scanTaskId: string, commitId: string) {
        this.viewType = IssueTreeViewType.dsr;
        this.projectId = projectId;
        this.scanTaskId = scanTaskId;
        this.commitId = commitId;

        this.fileId = '';
    }

    public toggleViewMode() {
        this.viewType = this.viewType === IssueTreeViewType.normal ? IssueTreeViewType.ruleset: IssueTreeViewType.normal;
    }
}