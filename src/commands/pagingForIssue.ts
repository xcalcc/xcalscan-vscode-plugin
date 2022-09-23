import * as vscode from 'vscode';
import issueTreeManager from '../dataManager/issueTreeManager';
import IIssue from '../model/issue';
import IPagingNode from '../model/pagingNode';

export async function pagingForIssue(context: vscode.ExtensionContext, pagingNode: IPagingNode, issue: IIssue | undefined) {
    await issueTreeManager.loadAndCacheIssueList({
        context,
        issueViewType: pagingNode.issueViewType,
        projectId: pagingNode.projectId,
        scanTaskId: pagingNode.scanTaskId,
        scanFileId: pagingNode.scanFileId,
        dsrType: pagingNode.dsrType,
        csvCode: issue?.csvCode,
        riskLevel: issue?.criticality
    });

    vscode.commands.executeCommand('xcalscan.refreshIssueTree');
}