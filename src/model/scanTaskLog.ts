export default interface IScanTaskLog {
    commitId: string,
    baselineCommitId?: string,
    fixedCount: number,
    newCount: number,
    scanEndAt: number,
    scanStartAt: number,
    scanTaskId: string,
    status: string
}