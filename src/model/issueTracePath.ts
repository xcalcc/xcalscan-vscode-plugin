import IIssueTracePathNode from './issueTracePathNode';

export default interface IIssueTracePath {
    id: string,
    issueGroupId: string,
    certainty: string,
    traceCount: number,
    status: string,
    dsr: string,
    tracePathNodes: Array<IIssueTracePathNode>,
    _index: number,
    _message: string
}