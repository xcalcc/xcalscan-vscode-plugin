import * as vscode from 'vscode';
import utils from './utils';
import commands from './commands';
import common from './common';
import { channel, ChannelType } from './common/channel';
import logger from './utils/logger';
import IIssue from './model/issue';
import IIssueTracePathNode from './model/issueTracePathNode';
import { ProjectTreeNode } from './model/projectTreeNode';
import IssueTreeNode from './model/issueTreeNode';
import IssueTreeNodeType from './model/issueTreeNodeType';
import MainTreeDataProvider from './views/explorer/mainTreeDataProvider';
import DsrTreeDataProvider from './views/explorer/dsrTreeDataProvider';
import IssueTreeDataProvider from './views/explorer/issueTreeDataProvider';
import FavoriteTreeDataProvider from './views/explorer/favoriteTreeDataProvider';
import StatusbarProvider from './views/statusbar/statusbarProvider';
import IIssueTracePath from './model/issueTracePath';
import IPagingNode from './model/pagingNode';
import userManager from './dataManager/userManager';
import xcalscanManager from './dataManager/xcalscanManager';
import globalManager from './dataManager/globalManager';

export function activate(context: vscode.ExtensionContext) {
    process.on('unhandledRejection', (reason) =>{
        logger.error(reason);
        utils.prompt.showErrorMessage(common.getApiMessage(reason));
    });

    try{
        globalManager.setContext(context);

        const mainTreeDataProvider = new MainTreeDataProvider(context);
        const dsrTreeDataProvider = new DsrTreeDataProvider(context);
        const issueTreeDataProvider = new IssueTreeDataProvider(context);
        const favoriteTreeDataProvider = new FavoriteTreeDataProvider(context);
        const statusbarProvider = new StatusbarProvider(context);
        statusbarProvider.show();

        const mainTreeView = vscode.window.createTreeView('xcalscanMainTreeView', { treeDataProvider: mainTreeDataProvider });
        const dsrTreeView = vscode.window.createTreeView('xcalscanDsrTreeView', { treeDataProvider: dsrTreeDataProvider });
        const issueTreeView = vscode.window.createTreeView('xcalscanIssueTreeView', { treeDataProvider: issueTreeDataProvider });
        const favoriteTreeView  = vscode.window.createTreeView('xcalscanFavoriteTreeView', { treeDataProvider: favoriteTreeDataProvider });

        issueTreeView.onDidExpandElement((node: vscode.TreeViewExpansionEvent<IssueTreeNode>) => {
            const element = node.element;
            if(element.nodeType === IssueTreeNodeType.TRACE_PATH){
                vscode.commands.executeCommand('xcalscan.selectTracePath', element.currentNodeData as IIssueTracePath);
            }
        });

        context.subscriptions.push(
            statusbarProvider,
            mainTreeView,
            dsrTreeView,
            issueTreeView,
            favoriteTreeView,

            vscode.commands.registerCommand("xcalscan.login", () => commands.login(context)),
            vscode.commands.registerCommand("xcalscan.gotoSetting", () => commands.gotoSetting()),
            vscode.commands.registerCommand("xcalscan.setServer", () => commands.setServer()),
            vscode.commands.registerCommand("xcalscan.setClient", () => commands.setClient()),
            vscode.commands.registerCommand("xcalscan.createOrScan", (projectPath?: vscode.Uri | string) => commands.createOrScan(context, mainTreeView, projectPath)),
            vscode.commands.registerCommand("xcalscan.createProject", (projectName, projectPath) => commands.createProject.createAndScan(context, projectName, projectPath)),
            vscode.commands.registerCommand("xcalscan.linkWithProject", () => commands.linkWithProject(mainTreeView)),
            vscode.commands.registerCommand("xcalscan.unlink", () => commands.unlinkProject(mainTreeView)),
            vscode.commands.registerCommand("xcalscan.projectView", () => commands.toggleDsrView(false)),
            vscode.commands.registerCommand("xcalscan.dsrView", () => commands.toggleDsrView(true)),
            vscode.commands.registerCommand("xcalscan.viewScanResult", (projectId, isFromScanning) => commands.viewScanResult(context, projectId, isFromScanning)),
            vscode.commands.registerCommand("xcalscan.scanResultLoadCompleted", (projectId, scanTaskId) => favoriteTreeDataProvider.setContent(projectId)),
            vscode.commands.registerCommand("xcalscan.selectCommitId", (projectId, scanTaskId, commitId) => commands.selectCommitId(projectId, scanTaskId, commitId)),
            vscode.commands.registerCommand("xcalscan.selectIssueFile", (projectId, scanTaskId, scanFileId, scanFilePath) => commands.selectIssueFile(projectId, scanTaskId, scanFileId, scanFilePath)),
            vscode.commands.registerCommand("xcalscan.selectTracePath", (issueTracePath: IIssueTracePath) => commands.selectTracePath(issueTracePath)),
            vscode.commands.registerCommand("xcalscan.selectTracePathNode", (issueTracePathNode: IIssueTracePathNode, issue: IIssue | undefined) => commands.selectTracePathNode(context, issueTracePathNode, issue)),
            vscode.commands.registerCommand("xcalscan.pagingForIssue", (pagingNode: IPagingNode, issue: IIssue | undefined) => commands.pagingForIssue(context, pagingNode, issue)),
            vscode.commands.registerCommand("xcalscan.pagingForIssueTrace", (pagingNode: IPagingNode, issue: IIssue) => commands.pagingForIssueTrace(context, pagingNode, issue)),
            vscode.commands.registerCommand('xcalscan.openScanResultWithBrowser', (element: ProjectTreeNode) => commands.openScanResultWithBrowser(element)),
            vscode.commands.registerCommand("xcalscan.search", () => commands.search(context)),
            vscode.commands.registerCommand('xcalscan.readme', () => commands.viewReadme(context)),
            vscode.commands.registerCommand('xcalscan.refreshMainTree', () => {
                mainTreeDataProvider.refresh();
                issueTreeDataProvider.clear();
                issueTreeDataProvider.refresh();
                favoriteTreeDataProvider.refresh();
                dsrTreeDataProvider.clear();
                dsrTreeDataProvider.refresh();
            }),
            vscode.commands.registerCommand('xcalscan.updateIssueTreeByFileId', (projectId, scanTaskId, scanFileId) => issueTreeDataProvider.setContentByScanFileId(projectId, scanTaskId, scanFileId)),
            vscode.commands.registerCommand('xcalscan.updateIssueTreeByCommitId', (projectId, scanTaskId, commitId) => issueTreeDataProvider.setContentByCommitId(projectId, scanTaskId, commitId)),
            vscode.commands.registerCommand('xcalscan.refreshIssueTree', () => issueTreeDataProvider.refresh()),
            vscode.commands.registerCommand('xcalscan.clearIssueTree', () => issueTreeDataProvider.clear()),
            vscode.commands.registerCommand('xcalscan.toggleViewModeOfIssueList', () => {
                issueTreeDataProvider.toggleViewMode();
                issueTreeDataProvider.refresh();
            }),
            vscode.commands.registerCommand('xcalscan.refreshFavoriteTree', () => favoriteTreeDataProvider.refresh()),
            vscode.commands.registerCommand('xcalscan.setLoadingOfTree', () => {
                mainTreeDataProvider.clear();
                mainTreeDataProvider.setLoading();
                mainTreeDataProvider.refresh();
                issueTreeDataProvider.clear();
                issueTreeDataProvider.refresh();
                favoriteTreeDataProvider.refresh();
                dsrTreeDataProvider.clear();
                dsrTreeDataProvider.refresh();
                channel.clear(ChannelType.scanSummary);
            }),
            vscode.commands.registerCommand('xcalscan.cancelLoadingOfTree', () => {
                mainTreeDataProvider.cancelLoading();
                mainTreeDataProvider.refresh();
            }),
            vscode.commands.registerCommand('xcalscan.refresh', () => {
                xcalscanManager.loadScanResultsForTree(context, true);
            })
        );

        userManager.isLogin() &&
        xcalscanManager.loadScanResultsForTree(context);
    }
    catch(error) {
        logger.error('---plugin runtime error---');
        logger.error(error);
        error && utils.prompt.showErrorMessage('runtime error:' + Object(error).message);
    }
}

export function deactivate() {
    globalManager.setClientIsRunning(false);
}
