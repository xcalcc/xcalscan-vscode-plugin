import * as vscode from 'vscode';
import utils from '../utils';
import { ISSUE_PAGING_SIZE } from '../common/constants';
import IIssue from '../model/issue';
import IRuleInformation from '../model/ruleInformation';
import configurationManager from '../dataManager/configurationManager';
import userManager from '../dataManager/userManager';
import ruleManager from '../dataManager/ruleManager';
import issueManager from '../dataManager/issueManager';
import issueTreeManager from '../dataManager/issueTreeManager';

export async function search(context: vscode.ExtensionContext){
    if(!userManager.isLogin()){
        utils.prompt.showWarningMessage('请先登录。');
        vscode.commands.executeCommand('xcalscan.login');
        return;
    }

    const issueSeqId: string | undefined = await vscode.window.showInputBox({
        prompt: '请输入要搜索的缺陷ID',
        ignoreFocusOut: true,
        validateInput: (s: string): string | undefined => s && s.trim() ? undefined : '缺陷ID不能为空',
    });

    if(issueSeqId === undefined) {
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;

    if(!workspaceFolders) {
        utils.prompt.showWarningMessage("请先打开一个本地项目");
        return;
    }

    const folder = workspaceFolders[0];
    const localProjectData = await configurationManager.getLocalProjectData(folder);
    const projectUUID = localProjectData.projectUUID;
    if(!projectUUID) {
        utils.prompt.showWarningMessage("项目未扫描!");
        return;
    }

    const data = await issueManager.fetchIssueList({
        projectId: projectUUID,
        scanFileIds: [],
        issueGroupId: issueSeqId,
        pageNumber: 0,
        pageSize: ISSUE_PAGING_SIZE
    });

    const issueData = (data.content || [])[0];

    if(issueData) {
        const ruleList: IRuleInformation[] | undefined = await ruleManager.getRuleList(context);

        const issue: IIssue = issueTreeManager.convertIssueToDto(issueData, 0, 1, ruleList);
        issueTreeManager.addIssueToFavorite(projectUUID, issue);
        vscode.commands.executeCommand('xcalscan.refreshFavoriteTree');
        utils.prompt.showInformationMessage("找到1条数据，请在左则[搜索结果]栏中查看。");
    } else {
        utils.prompt.showWarningMessage("没有找到结果");
    }
}