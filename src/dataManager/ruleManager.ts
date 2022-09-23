import * as vscode from 'vscode';
import utils from '../utils';
import logger from '../utils/logger';
import common from '../common';
import { CACHE_TYPE } from '../common/constants';
import IRuleSet from '../model/ruleSet';
import IRuleInformation from '../model/ruleInformation';
import IPathMsg from '../model/pathMsg';
import ruleService from '../service/ruleService';

class RuleManager {

    public async getRuleSets(context: vscode.ExtensionContext): Promise<IRuleSet[] | undefined> {
        const ruleSets = context.workspaceState.get<IRuleSet[]>(CACHE_TYPE.RULE_SETS);
        if(ruleSets && ruleSets.length > 0) return ruleSets;

        try {
            const response = await ruleService.getRuleSets();
            const responseData = response.data || {};
            const dataList = responseData.data || [];

            const ruleSetList: IRuleSet[] = [];

            dataList.forEach((data:any) => {
                ruleSetList.push({
                    id: data['id'],
                    code: data['code'],
                    displayName: data['displayName']
                });
            });

            if(ruleSetList.length > 0) {
                context.workspaceState.update(CACHE_TYPE.RULE_SETS, ruleSetList);
                return ruleSetList;
            }
        } catch(err) {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
        }

        logger.warn('The rule sets is empty');

        return undefined;
    }

    public async getRuleStandards(context: vscode.ExtensionContext): Promise<Object | undefined> {
        const ruleStandard = context.workspaceState.get<Object>(CACHE_TYPE.RULE_STANDARDS);
        if(ruleStandard) return ruleStandard;

        try {
            const response = await ruleService.getRuleStandards();
            const standardData = response.data.data;

            if(!utils.json.isEmptyObject(standardData)) {
                context.workspaceState.update(CACHE_TYPE.RULE_STANDARDS, standardData);

                return standardData;
            }
        } catch(err) {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
        }

        logger.warn('The rule standards is empty');
        return undefined;
    }

    public async getRuleList(context: vscode.ExtensionContext): Promise<IRuleInformation[] | undefined> {
        const rules = context.workspaceState.get<IRuleInformation[]>(CACHE_TYPE.RULE_LIST);
        if(rules && rules.length > 0) return rules;

        try {
            const response = await ruleService.getRuleList();

            const dataList = response.data.rules || [];
            const ruleList: IRuleInformation[] = [];

            let ruleSet: any = {};
            dataList.forEach((data:any) => {
                ruleSet = data['ruleSet'] || {};

                ruleList.push({
                    category: data['category'],
                    language: data['language'],
                    code: data['code'],
                    name: data['name'],
                    desc: data['desc'],
                    msg_templ: data['msg_templ'],
                    severity: data['severity'],
                    likelihood: data['likelihood'],
                    cost: data['cost'],
                    standards: data['standards'] || {},
                    csv_string: data['csv_string'] || [],
                    alias: data['alias'] || {},
                    ruleSet: {
                        id: ruleSet['id'],
                        code: ruleSet['code'],
                        displayName: ruleSet['displayName']
                    },
                    details: data['details'],
                    examples: data['examples'] || {}
                });
            });

            if(ruleList.length > 0) {
                context.workspaceState.update(CACHE_TYPE.RULE_LIST, ruleList);
                return ruleList;
            }
        } catch(err) {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
        }

        logger.warn('The rule list is empty');
        return undefined;
    }

    public async getPathMsgs(context: vscode.ExtensionContext): Promise<IPathMsg[] | undefined> {
        const pathMsgs = context.workspaceState.get<IPathMsg[]>(CACHE_TYPE.PATH_MSG_LIST);
        if(pathMsgs && pathMsgs.length > 0) return pathMsgs;

        try {
            const response = await ruleService.getPathMsg();

            const dataList = response.data.data || [];
            const pathMsgList: IPathMsg[] = [];

            dataList.forEach((data:any) => {
                pathMsgList.push({
                    id: data['id'],
                    msg: data['msg']
                });
            });

            if(pathMsgList.length > 0) {
                context.workspaceState.update(CACHE_TYPE.PATH_MSG_LIST, pathMsgList);
                return pathMsgList;
            }
        } catch(err) {
            utils.prompt.showErrorMessage(common.getApiMessage(err));
        }

        logger.warn('The path msgs is empty');
        return undefined;
    }

    public async getRuleInfo(context: vscode.ExtensionContext, csvCode: string): Promise<IRuleInformation | undefined> {
        const ruleList: IRuleInformation[] | undefined = await this.getRuleList(context);
        return ruleList?.find(x => x.csv_string?.includes(csvCode) || x.code === csvCode);
    }

    public getRuleInfoSync(ruleList: IRuleInformation[], csvCode: string): IRuleInformation | undefined {
        return ruleList?.find(x => x.csv_string?.includes(csvCode) || x.code === csvCode);
    }

    public async clearCache(context: vscode.ExtensionContext): Promise<void> {
        await context.workspaceState.update(CACHE_TYPE.RULE_SETS, undefined);
        await context.workspaceState.update(CACHE_TYPE.RULE_LIST, undefined);
        await context.workspaceState.update(CACHE_TYPE.RULE_STANDARDS, undefined);
        await context.workspaceState.update(CACHE_TYPE.PATH_MSG_LIST, undefined);
    }
}

export default new RuleManager();