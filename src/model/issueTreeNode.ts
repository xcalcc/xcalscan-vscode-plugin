import * as vscode from "vscode";
import * as path from 'path';
import utils from '../utils';
import IIssueDsrCategory from './issueDsrCategory';
import IIssueCategory from './issueCategory';
import IIssue from './issue';
import IIssueTracePath from './issueTracePath';
import IIssueTracePathNode from './issueTracePathNode';
import IPagingNode from './pagingNode';
import IssueTreeNodeType from './issueTreeNodeType';
import PagingNodeType from "./pagingNodeType";

export default class IssueTreeNode {
    constructor(
        private _nodeType: IssueTreeNodeType,
        private _currentNodeData?:  IIssue | 
                                    IIssueTracePath | 
                                    IIssueTracePathNode | 
                                    IIssueCategory | 
                                    IIssueDsrCategory | 
                                    IPagingNode,
        private _issue?: IIssue,
        private _uuid?: string
    ) {
        if(_nodeType === IssueTreeNodeType.ISSUE) {
            this._issue = <IIssue>_currentNodeData;
        }
    }

    public get uuid(): string {
        return this._uuid || utils.uuid.uuid()
    }

    public get label(): string | undefined {
        let label;

        switch(this._nodeType) {
            case IssueTreeNodeType.DSR_CATEGORY:
                const issueDsrCategory = this._currentNodeData as IIssueDsrCategory;
                label = issueDsrCategory.label;
                break;

            case IssueTreeNodeType.RULE_SET:
            case IssueTreeNodeType.ISSUE_LEVEL:
            case IssueTreeNodeType.ISSUE_RULE:
                const issueCategory = this._currentNodeData as IIssueCategory;
                label = issueCategory.label;
                break;

            case IssueTreeNodeType.ISSUE:
                if(this._issue !== undefined) {
                    label = (this._issue._index + 1) + '. ' + this._issue.id;
                }
                break;

            case IssueTreeNodeType.TRACE_PATH:
                let issueTraceInfo = this._currentNodeData as IIssueTracePath;
                label = '执行路径 #' + (issueTraceInfo._index + 1);
                break;

            case IssueTreeNodeType.TRACE_PATH_NODE:
                let issueTrace = this._currentNodeData as IIssueTracePathNode;
                label = '行号 ' + issueTrace.lineNo;
                break;

            case IssueTreeNodeType.PAGING:
                label = '更多 ↓';
                break;

            case IssueTreeNodeType.NO_DATA:
                label = '无数据';
                break;
            default:
                break;
        }

        return label;
    }

    public get tooltip(): string | undefined {
        let value;

        switch(this._nodeType) {
            case IssueTreeNodeType.ISSUE:
                if(this._issue !== undefined) {
                    value = this._issue.certainty === 'D' ? '确定的' : '';
                }
                break;

            case IssueTreeNodeType.TRACE_PATH:
                const issueTracePath = this._currentNodeData as IIssueTracePath;
                value = issueTracePath._message;
                break;

            case IssueTreeNodeType.TRACE_PATH_NODE:
                const pathNode = this._currentNodeData as IIssueTracePathNode;
                value = pathNode.file;
                break;

            case IssueTreeNodeType.PAGING:
                value = undefined;
                break;

            default:
                break;
        }

        return value;
    }

    public get description(): string | undefined {
        let value;

        switch(this._nodeType) {
            case IssueTreeNodeType.DSR_CATEGORY:
                const issueDsrCategory = this._currentNodeData as IIssueDsrCategory;
                value = issueDsrCategory.issueCount === undefined ? undefined : issueDsrCategory.issueCount.toString();
                break;

            case IssueTreeNodeType.RULE_SET:
            case IssueTreeNodeType.ISSUE_LEVEL:
            case IssueTreeNodeType.ISSUE_RULE:
                const issueCategory = this._currentNodeData as IIssueCategory;
                value = issueCategory.issueCount.toString();
                break;

            case IssueTreeNodeType.ISSUE:
                if(this._issue !== undefined) {
                    value = this._issue.certainty === 'D' ? '确定的 | ' : '';
                    value += this._issue._ruleCode || this._issue.csvCode;
                }
                break;

            case IssueTreeNodeType.TRACE_PATH:
                const issueTracePath = this._currentNodeData as IIssueTracePath;
                value = issueTracePath._message;
                break;

            case IssueTreeNodeType.TRACE_PATH_NODE:
                const pathNode = this._currentNodeData as IIssueTracePathNode;
                value = pathNode._message;
                break;

            default:
                break;
        }

        return value;
    }

    public get nodeType(): IssueTreeNodeType {
        return this._nodeType;
    }

    public get currentNodeData(): IIssue | IIssueTracePath | IIssueTracePathNode | IIssueCategory | IIssueDsrCategory | IPagingNode | undefined {
        return this._currentNodeData;
    }

    public get issueData(): IIssue | undefined {
        return this._issue;
    }

    public get command(): vscode.Command | undefined {
        switch(this._nodeType) {
            case IssueTreeNodeType.ISSUE:
            case IssueTreeNodeType.TRACE_PATH:
                return undefined;
            case IssueTreeNodeType.TRACE_PATH_NODE:
                return {
                    title: 'selectTracePathNode',
                    command: 'xcalscan.selectTracePathNode',
                    arguments: [this.currentNodeData as IIssueTracePathNode, this.issueData]
                };
            case IssueTreeNodeType.PAGING:
                const currentNodeData = this.currentNodeData as IPagingNode;
                if(currentNodeData.pagingNodeType === PagingNodeType.ISSUE) {
                    return {
                        title: 'pagingForIssue',
                        command: 'xcalscan.pagingForIssue',
                        arguments: [currentNodeData, this.issueData]
                    };
                } else {
                    return {
                        title: 'pagingForIssueTrace',
                        command: 'xcalscan.pagingForIssueTrace',
                        arguments: [currentNodeData, this.issueData]
                    };
                }
        }
    }

    public get iconPath() {
        let iconName = '';
        let _iconPath = undefined;
        switch(this.nodeType) {
            case IssueTreeNodeType.DSR_CATEGORY:
                break;
            case IssueTreeNodeType.RULE_SET:
                break;
            case IssueTreeNodeType.ISSUE_LEVEL:
                break;
            case IssueTreeNodeType.ISSUE_RULE:
                break;
            case IssueTreeNodeType.ISSUE:
                iconName = 'warning.png';
                break;
            case IssueTreeNodeType.TRACE_PATH:
                iconName = 'dependency.svg';
                break;
            case IssueTreeNodeType.TRACE_PATH_NODE:
                iconName = 'dot.png';
                break;
            case IssueTreeNodeType.PAGING:
                break;
        }

        if(iconName) {
            _iconPath = {
                light: path.join(__dirname, '..', 'resources', 'light', iconName),
                dark: path.join(__dirname, '..', 'resources', 'dark', iconName)
            }
        }

        return _iconPath;
    }
}