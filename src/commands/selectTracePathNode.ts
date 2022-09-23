import * as vscode from 'vscode';
import utils from '../utils';
import logger from '../utils/logger';
import IIssue from '../model/issue';
import IIssueTracePathNode from '../model/issueTracePathNode';
import IRuleInformation from '../model/ruleInformation';
import vsDocumentManager from '../dataManager/vsDocumentManager';
import panelManager from '../webview/panelManager';
import { markdownEngine } from '../webview/markdownEngine';
import ruleManager from '../dataManager/ruleManager';

export async function selectTracePathNode(context: vscode.ExtensionContext, issueTracePathNode: IIssueTracePathNode, issue: IIssue | undefined){
    //open file
    if(!issue) return;

    const localPath = vsDocumentManager.searchFilePosition(issueTracePathNode.file);
    if(!localPath) {
        utils.prompt.showErrorMessage(`The file does not exist in the current workspace: ${issueTracePathNode.file}`);
        return;
    }

    vsDocumentManager.goToDefinition(localPath, issueTracePathNode.lineNo, undefined);

    const rule: IRuleInformation | undefined = await ruleManager.getRuleInfo(context, issue.csvCode);

    if(!rule) {
        logger.error(`open rule detail webview error.rule ${issue.csvCode} not found in rule list.`);
        return;
    }

    const htmlTitle = `[${rule.code}] ${rule.name}`;
    let htmlContent = markdownEngine.md2html(rule.details);

    const ruleAndStandardListHTML = await getRuleAndStandardListHTML(context, rule);
    const exampleGoodHTML = getExampleListHTML(rule.examples['good']);
    const exampleBadHTML = getExampleListHTML(rule.examples['bad']);

    if(ruleAndStandardListHTML) {
        htmlContent += '<br/>';
        htmlContent += '<h4>规则和标准</h4>';
        htmlContent += ruleAndStandardListHTML;
    }
    
    if(exampleBadHTML) {
        htmlContent += '<br/>';
        htmlContent += '<h4>EXAMPLE - AVOID</h4>';
        htmlContent += exampleBadHTML;
    }

    if(exampleGoodHTML) {
        htmlContent += '<br/>';
        htmlContent += '<h4>EXAMPLE - PREFER</h4>';
        htmlContent += exampleGoodHTML;
    }

    panelManager.showWebview(htmlTitle, htmlContent, true);
}

// get the rule & standards
async function getRuleAndStandardListHTML(context: vscode.ExtensionContext, rule: IRuleInformation) {
    const ruleAndStandardList = await getRuleAndStandardList(context, rule);

    const standardListHtml: Array<string> = [];
    ruleAndStandardList.forEach((std: any) => {
        standardListHtml.push(`
            <p>
                ${std.stdType.toUpperCase()} ${std.code}: &nbsp;&nbsp;
                <a target="_blank" title=${std.url} href=${std.url}>
                    ${std.name}
                </a>
            </p>`
        );
    });

    return standardListHtml.join('');
}

async function getRuleAndStandardList(context: vscode.ExtensionContext, rule: IRuleInformation) {
    const ruleAndStdList: Array<object> = [];

    const alias = rule.alias || {};
    const standards = rule.standards || {};
    const standardMap: any = {...standards, ...alias};

    const allStandardMap: any = await ruleManager.getRuleStandards(context);

    Object.keys(standardMap).forEach(stdType => {
        const codeList = (standardMap[stdType] || []).sort((a: string, b: string) => {
            let aMatch = a.match(/\d+/) || [];
            let bMatch = b.match(/\d+/) || [];
            return Number(aMatch[0]) > Number(bMatch[0]) ? 1 : -1;
        });

        codeList.forEach((code: string) => {
            const std = (allStandardMap[stdType] && allStandardMap[stdType][code]) || {};
            std.stdType = stdType;
            std.code = code;
            ruleAndStdList.push(std);
        });
    });
    return ruleAndStdList;
}

// get the examples
function getExampleListHTML(exampleData: any) {
    const exampleListHtml: Array<string> = [];

    Object.keys(exampleData).forEach(lang => {
        exampleListHtml.push('<pre>');
        exampleListHtml.push(`<p>${lang}</p >`);

        exampleData[lang].forEach((code: string) => {
            exampleListHtml.push(`<code>${code}</code>`);
            exampleListHtml.push('<p>&nbsp;</p>');
        });

        exampleListHtml.push('</pre>');
    });

    return exampleListHtml.join('');
}
