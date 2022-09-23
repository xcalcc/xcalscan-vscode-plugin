import * as vscode from 'vscode';
import logger from '../utils/logger';
import IIssue from '../model/issue';
import IPathMsg from '../model/pathMsg';
import IIssueTracePath from '../model/issueTracePath';
import IIssueTracePathNode from '../model/issueTracePathNode';
import IIssueCategory from '../model/issueCategory';
import IPagingNode from '../model/pagingNode';
import PagingNodeType from '../model/pagingNodeType';
import IssueTreeNodeType from '../model/issueTreeNodeType';
import IssueTreeNode from '../model/issueTreeNode';
import IssueTreeViewType from '../model/issueTreeViewType';
import IRuleInformation from '../model/ruleInformation';
import IIssueDsrCategory from '../model/issueDsrCategory';
import DsrType from '../model/dsrType';
import utils from '../utils';
import ruleManager from './ruleManager';
import issueManager from './issueManager';
import { 
    ISSUE_PRIORITY, 
    ISSUE_PAGING_SIZE, 
    ISSUE_TRACE_PATH_PAGING_SIZE,
    RULE_MSG_TEMPL_KEYWORDS
} from '../common/constants';


interface IIssuePagingData {
    projectId: string,
    scanTaskId?: string,
    scanFileId: string,
    totalPages: number,
    currentPage: number,
    issueList: Array<IIssue>
}

interface IFavoriteIssueData {
    projectId: string,
    issueList: Array<IIssue>
}

interface IIssuePagingDataWithRule extends IIssuePagingData {
    riskLevel: string,
    rule_csvCode: string
}

interface IIssuePagingDataWithDsr extends IIssuePagingData {
    dsrType: DsrType,
}

interface IIssueTracePagingData {
    issueId: string,
    totalPages: number,
    currentPage: number,
    tracePathList: Array<IIssueTracePath>
}

interface ISummaryData {
    projectId: string,
    scanFileId: string,
    /* The summary data structure refers to /demo/issue_group_criticality_count.dto.json */
    summary: any
}

class IssueTreeManager implements vscode.Disposable {
    private issueDataListForNormalView: Array<IIssuePagingData> = [];
    private issueDataListForRulesetView: Array<IIssuePagingDataWithRule> = [];
    private issueDataListForFavoriteView: Array<IFavoriteIssueData> = [];
    private issueDataListForDsrView: Array<IIssuePagingDataWithDsr> = [];
    private issueTracePathList: Array<IIssueTracePagingData> = [];
    private issueSummaryDataList: Array<ISummaryData> = [];

    /**
     * Gets the issue dsr category elements of the issue tree
     *
     */
    public getIssueRootNodesForDsrView(): IssueTreeNode[] {
        let issueTreeNodeList: IssueTreeNode[] = [];

        const issueDsrCategory: Array<IIssueDsrCategory> = [
            {
                label: '新的缺陷',
                value: DsrType.NEW,
                issueCount: undefined,
                dsrType: DsrType.NEW
            },
            {
                label: '未修复的缺陷',
                value: DsrType.OUTSTANDING,
                issueCount: undefined,
                dsrType: DsrType.OUTSTANDING
            },
            {
                label: '已修复的缺陷',
                value: DsrType.FIXED,
                issueCount: undefined,
                dsrType: DsrType.FIXED
            }
        ];

        issueTreeNodeList = issueDsrCategory.map(data => new IssueTreeNode(IssueTreeNodeType.DSR_CATEGORY, data));

        return issueTreeNodeList;
    }

    /**
     * Gets the issue elements of the issue tree
     *
     * @param projectId The project id.
     * @param scanTaskId The scan task id.
     * @param dsrType The dsr type (N, E, F).
     */
    public async getIssueListForDsrView(
        context: vscode.ExtensionContext, 
        projectId: string, 
        scanTaskId: string, 
        dsrType: DsrType,
    ): Promise<IssueTreeNode[]> {
        let issueTreeNodeList: IssueTreeNode[] = [];

        let issuesData = this.issueDataListForDsrView.find(x => 
            x.projectId === projectId && 
            x.scanTaskId === scanTaskId && 
            x.dsrType === dsrType
        );

        if(!issuesData) {
            issuesData = await this.loadAndCacheIssueList({
                context,
                issueViewType: IssueTreeViewType.dsr,
                projectId,
                scanFileId: '',
                dsrType,
                scanTaskId
            }) as IIssuePagingDataWithDsr;
        }

        const currentPage = issuesData.currentPage || 0;
        const totalPages = issuesData.totalPages;
        const issueList = issuesData.issueList || [];

        if(issueList.length === 0) {
            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.NO_DATA));
        } else {
            issueTreeNodeList = issueList.map(issue => new IssueTreeNode(IssueTreeNodeType.ISSUE, issue, issue));

            // add more button
            if(currentPage < totalPages) {
                const pagingNode: IPagingNode = {
                    projectId,
                    scanFileId: '',
                    scanTaskId,
                    dsrType,
                    issueViewType: IssueTreeViewType.dsr,
                    pagingNodeType: PagingNodeType.ISSUE
                };

                issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.PAGING, pagingNode, issueList[0]));
            }
        }

        return issueTreeNodeList;
    }

    /**
     * Gets the issue elements of the issue tree
     *
     * @param projectId The project id.
     * @param scanFileId The scan file id.
     */
    public async getIssueListForNormalView(
            context: vscode.ExtensionContext, 
            projectId: string, 
            scanFileId: string
    ): Promise<IssueTreeNode[]> {
        let issueTreeNodeList: IssueTreeNode[] = [];
        let issuesData = this.issueDataListForNormalView.find(x => 
            x.projectId === projectId && 
            x.scanFileId === scanFileId
        );

        if(!issuesData) {
            issuesData = await this.loadAndCacheIssueList({
                context,
                issueViewType: IssueTreeViewType.normal,
                projectId,
                scanFileId
            }) as IIssuePagingData;
        }

        const currentPage = issuesData.currentPage || 0;
        const totalPages = issuesData.totalPages;
        const issueList = issuesData.issueList || [];

        if(issueList.length === 0) {
            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.NO_DATA));
        } else {
            issueTreeNodeList = issueList.map(issue => new IssueTreeNode(IssueTreeNodeType.ISSUE, issue));

            // add more button
            if(currentPage < totalPages) {
                const pagingNode: IPagingNode = {
                    projectId,
                    scanFileId,
                    issueViewType: IssueTreeViewType.normal,
                    pagingNodeType: PagingNodeType.ISSUE
                };

                issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.PAGING, pagingNode));
            }
        }

        return issueTreeNodeList;
    }

    /**
     * Gets the issue elements of the issue tree
     *
     * @param projectId The project id.
     * @param scanFileId The scan file id.
     * @param riskLevel The risk level.
     * @param csvCode The csv code of rule.
     */
    public async getIssueListForRulesetView(
            context: vscode.ExtensionContext,
            projectId: string, 
            scanFileId: string,
            csvCode: string,
            riskLevel: string
    ): Promise<IssueTreeNode[]> {
        let issueTreeNodeList: IssueTreeNode[] = [];

        let issuesData = this.issueDataListForRulesetView.find(x => 
            x.projectId === projectId && 
            x.scanFileId === scanFileId && 
            x.riskLevel === riskLevel && 
            x.rule_csvCode === csvCode
        );

        if(!issuesData) {
            issuesData = await this.loadAndCacheIssueList({
                context,
                issueViewType: IssueTreeViewType.ruleset,
                projectId,
                scanFileId,
                csvCode,
                riskLevel
            }) as IIssuePagingDataWithRule;
        }

        const currentPage = issuesData.currentPage || 0;
        const totalPages = issuesData.totalPages;
        const issueList = issuesData.issueList || [];

        if(issueList.length === 0) {
            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.NO_DATA));
        } else {
            issueTreeNodeList = issueList.map(issue => new IssueTreeNode(IssueTreeNodeType.ISSUE, issue, issue));

            // add more button
            if(currentPage < totalPages) {
                const pagingNode: IPagingNode = {
                    projectId,
                    scanFileId,
                    issueViewType: IssueTreeViewType.ruleset,
                    pagingNodeType: PagingNodeType.ISSUE
                };

                issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.PAGING, pagingNode, issueList[0]));
            }
        }

        return issueTreeNodeList;
    }

    /**
     * Gets the issue elements of the favorite tree
     *
     * @param projectId The project id.
     */
    public async getIssueListForFavoriteView(projectId: string) {
        let issueTreeNodeList: IssueTreeNode[] = [];
        let issuesData = this.issueDataListForFavoriteView.find(x => x.projectId === projectId);

        const issueList = issuesData?.issueList;

        if(issueList) {
            issueTreeNodeList = issueList.map(issue => new IssueTreeNode(IssueTreeNodeType.ISSUE, issue));
        } else {
            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.NO_DATA));
        }

        return issueTreeNodeList;
    }

    /**
     * Add the issue elements to the favorite tree
     *
     * @param projectId The project id.
     */
    public addIssueToFavorite(projectId: string, issue: IIssue) {
        let issuesData = this.issueDataListForFavoriteView.find(x => x.projectId === projectId);

        if(!issuesData) {
            this.issueDataListForFavoriteView.push({
                projectId,
                issueList: [issue]
            });
            return;
        }

        issuesData.issueList = [issue];

        // Support for storing multiple issues (unfinished)
        // const issueList = issuesData.issueList || [];
        // if(issueList.findIndex(x => x.id === issue.id) === -1) {
        //     issueList.push(issue);
        //     issuesData.issueList = issueList;
        // }
    }

    /**
     * Gets the trace path elements of the issue tree
     *
     * @param issue The Issue object.
     */
    public async getTracePathList(context: vscode.ExtensionContext, issue: IIssue, issueViewType: IssueTreeViewType): Promise<IssueTreeNode[]> {
        let issueTreeNodeList: IssueTreeNode[] = [];
        let issueTracePathData = this.issueTracePathList.find(x => x.issueId === issue.id);

        if(!issueTracePathData) {
            issueTracePathData = await this.loadAndCacheIssueTracePathList(context, issue);
        }

        const currentPage = issueTracePathData.currentPage || 0;
        const totalPages = issueTracePathData.totalPages;
        const tracePathList = issueTracePathData.tracePathList || [];

        issueTreeNodeList = tracePathList.map(trace => new IssueTreeNode(IssueTreeNodeType.TRACE_PATH, trace, issue));

        // add more button
        if(currentPage < totalPages) {
            const pagingNode: IPagingNode = {
                projectId: '',
                scanFileId: '',
                issueViewType: issueViewType,
                pagingNodeType: PagingNodeType.ISSUE_TRACE
            };

            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.PAGING, pagingNode, issue));
        }

        return issueTreeNodeList;
    }

    /**
     * Gets the nodes of the trace path elements of the issue tree
     *
     * @param issueTracePath The IssueTraceInfo object.
     * @param issue The Issue object.
     */
    public getTracePathNodeList(issueTracePath: IIssueTracePath, issue: IIssue): IssueTreeNode[] {
        const issueTreeNodeList: IssueTreeNode[] = [];

        const issueTracePathNodeList: IIssueTracePathNode[] = issueTracePath.tracePathNodes;

        issueTracePathNodeList.forEach(pathNode => {
            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.TRACE_PATH_NODE, pathNode, issue));
        });

        return issueTreeNodeList;
    }

    /**
     * Gets the rule set list
     *
     */
    public async getRuleSetList(context: vscode.ExtensionContext, projectId: string, scanFileId: string): Promise<IssueTreeNode[]> {
        const issueTreeNodeList: IssueTreeNode[] = [];
        let summaryData = this.issueSummaryDataList.find(x => x.scanFileId === scanFileId);

        if(!summaryData) {
            summaryData = await this.loadAndCacheIssueSummaryDataWithFile(context, projectId, scanFileId);
        }

        const summary = summaryData.summary || {};

        if(utils.json.isEmptyObject(summary)) {
            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.NO_DATA));
        } else {
            Object.keys(summary).forEach(ruleSetId => {

                const categoryNode: IIssueCategory = {
                    label: summary[ruleSetId].displayName,
                    value: ruleSetId,
                    issueCount: summary[ruleSetId].issueCount,
                    ruleSetId,
                    riskLevel: undefined,
                    csvCode: undefined
                };

                issueTreeNodeList.push(
                    new IssueTreeNode(
                        IssueTreeNodeType.RULE_SET, 
                        categoryNode
                    )
                );
            });
        }

        return issueTreeNodeList;
    }

    /**
     * Gets the issue level list
     *
     */
    public getIssueLevelList(scanFileId: string, ruleSetId: string): IssueTreeNode[] {
        let issueTreeNodeList: IssueTreeNode[] = [];
        const summaryData = this.issueSummaryDataList.find(x => x.scanFileId === scanFileId);

        if(!summaryData) return issueTreeNodeList;

        const summary = summaryData.summary || {};
        const currRuleSetSummary = summary[ruleSetId] || {};
        const hightSummary = currRuleSetSummary[ISSUE_PRIORITY.high] || {};
        const mediumSummary = currRuleSetSummary[ISSUE_PRIORITY.medium] || {};
        const lowSummary = currRuleSetSummary[ISSUE_PRIORITY.low] || {};

        const levelList: Array<IIssueCategory> = [
            {
                label: '高风险', 
                value: ISSUE_PRIORITY.high,
                issueCount: hightSummary.issueCount || 0,
                ruleSetId,
                riskLevel: ISSUE_PRIORITY.high,
                csvCode: undefined
            },
            {
                label: '中风险', 
                value: ISSUE_PRIORITY.medium,
                issueCount: mediumSummary.issueCount || 0,
                ruleSetId,
                riskLevel: ISSUE_PRIORITY.medium,
                csvCode: undefined
            },
            {
                label: '低风险', 
                value: ISSUE_PRIORITY.low,
                issueCount: lowSummary.issueCount || 0,
                ruleSetId,
                riskLevel: ISSUE_PRIORITY.low,
                csvCode: undefined
            }
        ];

        issueTreeNodeList = levelList.map(x => new IssueTreeNode(IssueTreeNodeType.ISSUE_LEVEL, x));

        return issueTreeNodeList;
    }

    /**
     * Gets the issue rule list (rule code list)
     *
     * @param scanTaskId The scan task id.
     * @param scanFileId The scan file id.
     * @param ruleSet The ruleset code.
     */
    public async getIssueRuleList(
            context: vscode.ExtensionContext, 
            scanFileId: string, 
            ruleSetId: string, 
            riskLevel: string
    ): Promise<IssueTreeNode[]> {
        let issueTreeNodeList: IssueTreeNode[] = [];
        const summaryData = this.issueSummaryDataList.find(x => x.scanFileId === scanFileId);

        if(!summaryData) return issueTreeNodeList;

        const summary = summaryData.summary || {};
        const ruleSetSummary = summary[ruleSetId] || {};
        const levelSummary = ruleSetSummary[riskLevel] || {};

        for(let csvCode in levelSummary['rule']) {
            const issueCount = Number(levelSummary['rule'][csvCode]) || 0;

            if(issueCount === 0) continue;

            const ruleInfomation: IRuleInformation | undefined = await ruleManager.getRuleInfo(context, csvCode);

            if(!ruleInfomation) {
                logger.debug(`csv code (${csvCode}) is not found in the rule list data.`);
                continue;
            }

            let categoryNode: IIssueCategory = {
                label: ruleInfomation.code, 
                value: csvCode,
                issueCount: issueCount,
                ruleSetId: ruleSetId,
                riskLevel: riskLevel,
                csvCode: csvCode,
                ruleInfomation
            };

            issueTreeNodeList.push(new IssueTreeNode(IssueTreeNodeType.ISSUE_RULE, categoryNode));
        }

        return issueTreeNodeList;
    }

    /*
     * Get and save issue list data for normal view or rule set view or dsr view
     */
    public async loadAndCacheIssueList({context, issueViewType, projectId, scanFileId, csvCode, riskLevel, scanTaskId, dsrType}: {
        context: vscode.ExtensionContext,
        issueViewType: IssueTreeViewType,
        projectId: string,
        scanFileId: string,
        csvCode?: string,
        riskLevel?: string,
        scanTaskId?: string,
        dsrType?: DsrType,
    }): Promise<IIssuePagingData | IIssuePagingDataWithRule> {
        let issuesData;

        if(issueViewType === IssueTreeViewType.normal) {
            issuesData = this.issueDataListForNormalView.find(x => 
                x.projectId === projectId && 
                x.scanFileId === scanFileId
            );
        } 

        if(issueViewType === IssueTreeViewType.ruleset) {
            issuesData = this.issueDataListForRulesetView.find(x => 
                x.projectId === projectId && 
                x.scanFileId === scanFileId && 
                x.rule_csvCode === csvCode &&
                x.riskLevel === riskLevel
            );
        }

        if(issueViewType === IssueTreeViewType.dsr) {
            csvCode = undefined;
            issuesData = this.issueDataListForDsrView.find(x => 
                x.projectId === projectId && 
                x.scanTaskId === scanTaskId && 
                x.dsrType === dsrType
            );
        } 

        const currentPage = issuesData?.currentPage || 0;
        const nextPage = currentPage + 1;

        if(issuesData && nextPage > issuesData.totalPages) {
            return issuesData;
        }

        const data = await issueManager.fetchIssueList({
            projectId,
            scanTaskId,
            scanFileIds: [scanFileId], 
            dsrType: dsrType ? [dsrType] : [DsrType.NEW, DsrType.OUTSTANDING],
            csvCodes: (csvCode && riskLevel) ? [{csvCode: csvCode, criticality: riskLevel}] : undefined,
            pageNumber: nextPage,
            pageSize: ISSUE_PAGING_SIZE
        });

        const ruleList: IRuleInformation[] | undefined = await ruleManager.getRuleList(context);

        const dataList = data.content || [];
        const issueList: Array<IIssue> = dataList.map((x: any, index: number) => this.convertIssueToDto(x, index, nextPage, ruleList));

        if(dataList.length === 0 && issueViewType === IssueTreeViewType.ruleset) {
            logger.warn('0 issues on releSet view. loadAndCacheIssueList() arguments: ' +  JSON.stringify(arguments)); 
        }

        if(issuesData) {
            issuesData.currentPage = nextPage;
            issuesData.issueList = issuesData.issueList.concat(issueList);
        } else {
            issuesData = {
                projectId,
                scanFileId,
                currentPage: nextPage,
                totalPages: data.totalPages,
                issueList
            };

            switch(issueViewType) {
                case IssueTreeViewType.normal:
                    this.issueDataListForNormalView.push(issuesData);
                    break;

                case IssueTreeViewType.ruleset:
                    issuesData = <IIssuePagingDataWithRule>issuesData;
                    issuesData.riskLevel = <string>riskLevel;
                    issuesData.rule_csvCode= <string>csvCode;
                    this.issueDataListForRulesetView.push(issuesData);
                    break;

                case IssueTreeViewType.dsr:
                    issuesData = <IIssuePagingDataWithDsr>issuesData;
                    issuesData.scanTaskId = scanTaskId;
                    issuesData.dsrType= <DsrType>dsrType;
                    this.issueDataListForDsrView.push(issuesData);
                    break;

                default:
                    break;
            }
        }

        return issuesData;
    }

    /*
     * Get and save list data of issue trace path
     */
    public async loadAndCacheIssueTracePathList(context: vscode.ExtensionContext, issue: IIssue): Promise<IIssueTracePagingData> {
        const issueId = issue.id;
        let issuesTracePathData = this.issueTracePathList.find(x => x.issueId === issueId);

        const currentPage = issuesTracePathData?.currentPage || 0;
        const nextPage = currentPage + 1;

        if(issuesTracePathData && nextPage > issuesTracePathData.totalPages) {
            return issuesTracePathData;
        }

        const pathMsgList = await ruleManager.getPathMsgs(context);
        const currentRule: IRuleInformation | undefined = await ruleManager.getRuleInfo(context, issue.csvCode);

        const data = await issueManager.fetchIssueTracePathList(issueId, nextPage, ISSUE_TRACE_PATH_PAGING_SIZE);

        const dataList = data.content || [];
        const tracePathList: Array<IIssueTracePath> = dataList.map((x: any, index: number) => 
            this.convertIssueTracePathToDto(x, index, nextPage, issue, pathMsgList, currentRule)
        );

        if(issuesTracePathData) {
            issuesTracePathData.currentPage = nextPage;
            issuesTracePathData.tracePathList = issuesTracePathData.tracePathList.concat(tracePathList);
        } else {
            issuesTracePathData = {
                issueId,
                currentPage: nextPage,
                totalPages: data.totalPages,
                tracePathList
            };
            this.issueTracePathList.push(issuesTracePathData);
        }

        return issuesTracePathData;
    }

    /*  
        Get and save issue summary data.
        The summary data structure refers to /demo/issue_group_criticality_count.json
     */
    public async loadAndCacheIssueSummaryDataWithFile(context: vscode.ExtensionContext, projectId: string, scanFileId: string): Promise<ISummaryData> {
        const ruleList: IRuleInformation[] | undefined = await ruleManager.getRuleList(context);

        const data = await issueManager.fetchIssueSummaryByScanFileId(projectId, scanFileId);
        const summary = data.criticalityRuleCodeCountMap || {};

        const issueCountMapWithRule: any = {};

        ruleList &&
        Object.keys(summary).forEach(level => {
            Object.keys(summary[level]).forEach(csv_code => {
                const rule = ruleManager.getRuleInfoSync(ruleList, csv_code);

                if(!rule) {
                    logger.warn(`csv code ${csv_code}(${summary[level][csv_code]} issues)] is not found in the rule list data.`);
                    return;
                }

                const ruleSetId = rule.ruleSet.id;

                if(!issueCountMapWithRule[ruleSetId]) {
                    issueCountMapWithRule[ruleSetId] = {};
                    issueCountMapWithRule[ruleSetId]['issueCount'] = 0;
                    issueCountMapWithRule[ruleSetId]['displayName'] = rule.ruleSet.displayName;
                }

                if(!issueCountMapWithRule[ruleSetId][level]) {
                    issueCountMapWithRule[ruleSetId][level] = {};
                    issueCountMapWithRule[ruleSetId][level]['rule'] = {};
                    issueCountMapWithRule[ruleSetId][level]['issueCount'] = 0;
                }

                issueCountMapWithRule[ruleSetId]['issueCount'] += Number(summary[level][csv_code]);
                issueCountMapWithRule[ruleSetId][level]['issueCount'] += Number(summary[level][csv_code]);
                issueCountMapWithRule[ruleSetId][level]['rule'][csv_code] = summary[level][csv_code];
            });
        });

        const summaryData: ISummaryData = {
            projectId,
            scanFileId,
            summary: issueCountMapWithRule
        };

        this.issueSummaryDataList.push(summaryData);

        return summaryData;
    }

    /**
     * Conversion issue to DTO
     *
     * @param issue The issue data.
     */
    public convertIssueToDto(
        issue: any, 
        index: number, 
        currentPage: number,
        ruleList: IRuleInformation[] | undefined
    ): IIssue {
        const _ruleCode = ruleList && ruleManager.getRuleInfoSync(ruleList, issue['ruleCode'])?.code;

        return {
            assigneeDisplayName: issue['assigneeDisplayName'],
            assigneeEmail: issue['assigneeEmail'],
            assigneeId: issue['assigneeId'],
            avgTraceCount: issue['avgTraceCount'],
            category: issue['category'],
            certainty: issue['certainty'],
            complexity: issue['complexity'],
            criticality: issue['criticality'],
            dsr: issue['dsr'],
            fixedScanTaskId: issue['fixedScanTaskId'],
            fixedTime: issue['fixedTime'],
            functionName: issue['functionName'],
            id: issue['id'],
            issueCount: issue['issueCount'],
            likelihood: issue['likelihood'],
            occurScanTaskId: issue['occurScanTaskId'],
            occurTime: issue['occurTime'],
            projectId: issue['projectId'],
            remediationCost: issue['remediationCost'],
            csvCode: issue['ruleCode'],
            ruleSet: issue['ruleSet'],
            severity: issue['severity'],
            sinkColumnNo: issue['sinkColumnNo'],
            sinkFilePath: issue['sinkFilePath'],
            sinkLineNo: issue['sinkLineNo'],
            sinkMessageId: issue['sinkMessageId'],
            sinkRelativePath: issue['sinkRelativePath'],
            srcColumnNo: issue['srcColumnNo'],
            srcFilePath: issue['srcFilePath'],
            srcLineNo: issue['srcLineNo'],
            srcMessageId: issue['srcMessageId'],
            srcRelativePath: issue['srcRelativePath'],
            status: issue['status'],
            variableName: issue['variableName'],
            _ruleCode: _ruleCode || '',
            _index: (ISSUE_PAGING_SIZE * (currentPage-1) + index)
        };
    }

    /**
     * Conversion issue trace path to DTO
     *
     * @param issue The issue trace path data.
     */
    private convertIssueTracePathToDto(
        issueTracePath: any, 
        index: number, 
        currentPage: number, 
        issue: IIssue, 
        pathMsgList: IPathMsg[] | undefined,
        rule: IRuleInformation | undefined
    ): IIssueTracePath {

        const issueTracePathNodes: IIssueTracePathNode[] = [];
        const tracePathNodeList = issueTracePath['tracePath'] || [];

        // get trace path node data
        tracePathNodeList.forEach((pathNode: any) => {
            const pathMsg = pathMsgList && pathMsgList.find(x => x.id === pathNode['msgId']);

            const issueTracePathNode: IIssueTracePathNode = {
                file: pathNode['file'],
                lineNo: pathNode['lineNo'],
                columnNo: pathNode['columnNo'],
                msgId: pathNode['msgId'],
                _message: pathMsg?.msg || ''
            };

            issueTracePathNodes.push(issueTracePathNode);
        });

        /*
            there is no Source and Sink data in the trace path API.
            these need to be manually added to the trace path.
        */
        if(issue.srcRelativePath) {
            const srcPathMsg = pathMsgList && pathMsgList.find(x => Number(x.id) === issue.srcMessageId);

            issueTracePathNodes.unshift({
                file: issue.srcRelativePath,
                lineNo: issue.srcLineNo,
                columnNo: issue.srcColumnNo,
                msgId: issue.srcMessageId,
                _message: srcPathMsg?.msg || ''
            });
        }

        if(issue.sinkRelativePath) {
            const sinkPathMsg = pathMsgList && pathMsgList.find(x => Number(x.id) === issue.sinkMessageId);

            issueTracePathNodes.push({
                file: issue.sinkRelativePath,
                lineNo: issue.sinkLineNo,
                columnNo: issue.sinkColumnNo,
                msgId: issue.sinkMessageId,
                _message: sinkPathMsg?.msg || ''
            });
        }

        // get msg templ
        const source = issueTracePathNodes[0] || {};
        const sink = issueTracePathNodes[issueTracePathNodes.length-1] || {};

        const pathMessage = (rule?.msg_templ || '')
            .replace(/\s/g, '')
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.source.file, 'ig'), source.file)
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.source.filename, 'ig'), source.file)
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.source.line, 'ig'), String(source.lineNo))
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.source.func, 'ig'), issue.functionName)
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.source.variable, 'ig'), issue.variableName)

            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.sink.file, 'ig'), sink.file)
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.sink.filename, 'ig'), sink.file)
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.sink.line, 'ig'), String(sink.lineNo))
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.sink.func, 'ig'), issue.functionName)
            .replace(new RegExp('\\' + RULE_MSG_TEMPL_KEYWORDS.sink.variable, 'ig'), issue.variableName);

        return {
            id: issueTracePath['id'],
            issueGroupId: issueTracePath['issueGroupId'],
            certainty: issueTracePath['certainty'],
            traceCount: issueTracePath['traceCount'],
            status: issueTracePath['status'],
            dsr: issueTracePath['dsr'],
            tracePathNodes: issueTracePathNodes,
            _index: (ISSUE_TRACE_PATH_PAGING_SIZE * (currentPage-1) + index),
            _message: pathMessage
        };
    }

    /**
     * Clear cached data of the previous scan
     *
     */
    public deleteIssueData(projectId: string, scanTaskId: string) {
        this.issueSummaryDataList = this.issueSummaryDataList.filter(x => x.projectId !== projectId);
        this.issueDataListForNormalView = this.issueDataListForNormalView.filter(x => x.projectId !== projectId);
        this.issueDataListForRulesetView = this.issueDataListForRulesetView.filter(x => x.projectId !== projectId);
        this.issueDataListForDsrView = this.issueDataListForDsrView.filter(x => x.projectId !== projectId);
        this.issueDataListForFavoriteView = this.issueDataListForFavoriteView.filter(x => x.projectId !== projectId);
    }

    /**
     * Dispose object
     *
     */
    public dispose(): void {
        this.issueSummaryDataList = [];
        this.issueDataListForNormalView = [];
        this.issueDataListForRulesetView = [];
        this.issueDataListForDsrView = [];
        this.issueDataListForFavoriteView = [];
        this.issueTracePathList = [];
    }
}

export default new IssueTreeManager();