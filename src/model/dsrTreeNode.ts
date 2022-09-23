import * as vscode from 'vscode';
import utils from '../utils';
import IScanTaskLog from './scanTaskLog';
import DsrTreeNodeType from './dsrTreeNodeType';

export default class DsrTreeNode {
    constructor(
        private _nodeType: DsrTreeNodeType,
        private _projectId: string,
        // only when the nodeType is COMMIT_DATA will there be data
        private data?: IScanTaskLog
    ) { }

    public get label(): string {
        if(!this.data) return '';
        const commitId = this.data.commitId.substr(0, 8);

        return commitId;
    }

    public get tooltip(): string | undefined {
        if(!this.data) return;
        const scanEndDate = utils.date.parseDate(this.data.scanEndAt);
        const localeScanDate = utils.date.dateFormat(scanEndDate, 'yyyy-MM-dd hh:mm:ss');

        return `commit id: ${this.data.commitId}
baseline commit id: ${this.data.baselineCommitId}
新增缺陷: ${this.data.newCount}
已修复: ${this.data.fixedCount}
扫描时间: ${localeScanDate}
`;
    }

    public get description(): string | undefined {
        if(!this.data) return;

        const diffCount = ` -${this.data.fixedCount} +${this.data.newCount}`

        const scanEndDate = utils.date.parseDate(this.data.scanEndAt);
        const localeScanDate = utils.date.dateFormat(scanEndDate, 'MM-dd hh:mm');

        const result: string = ` ${diffCount.padEnd(15)} ${localeScanDate}`;
        return result;
    }

    public get projectId(): string {
        return this._projectId;
    }

    public get nodeType(): DsrTreeNodeType {
        return this._nodeType;
    }

    public get command(): vscode.Command {
        return {
            title: 'Select File',
            command: 'xcalscan.selectCommitId',
            arguments: [this.projectId, this.data?.scanTaskId, this.data?.commitId]
        };
    }

    public get iconPath() {
        return new vscode.ThemeIcon('git-commit');
    }
}