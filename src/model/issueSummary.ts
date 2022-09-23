export default interface IIssueSummary {
    projectName: string,
    hasDsr: boolean,
    fileCount: string,
    lineCount: string,
    issuesCount: string,
    scanTime: string,
    totalTime: string,
    ruleSetNames: string[],
    scanTaskId: string,
    status: string
}