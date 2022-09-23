import IRuleInformation from './ruleInformation';

export default interface IIssueCategory {
    label: string,
    value: string,
    issueCount: number,
    ruleSetId: string,
    riskLevel?: string,
    csvCode?: string,
    ruleInfomation?: IRuleInformation
}