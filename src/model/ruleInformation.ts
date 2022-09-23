import IRuleSet from './ruleSet';

export default interface IRuleInformation {
    category: string,
    language: string,
    code: string,
    name: string,
    desc: string,
    msg_templ: string,
    severity: string,
    likelihood: string,
    cost: string,
    standards: object,
    csv_string: string[],
    alias: object,
    ruleSet: IRuleSet,
    details: string,
    examples: any
}