import * as vscode from 'vscode';
import issueTreeManager from '../dataManager/issueTreeManager';
import IPagingNode from '../model/pagingNode';
import IIssue from '../model/issue';

export async function pagingForIssueTrace(context: vscode.ExtensionContext, pagingNode: IPagingNode, issue: IIssue){
    await issueTreeManager.loadAndCacheIssueTracePathList(context, issue);

    vscode.commands.executeCommand('xcalscan.refreshIssueTree');
}