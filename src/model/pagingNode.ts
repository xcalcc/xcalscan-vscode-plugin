import PagingNodeType from './pagingNodeType';
import IssueTreeViewType from './issueTreeViewType';
import DsrType from './dsrType';

export default interface IPagingNode {
    issueViewType: IssueTreeViewType,
    pagingNodeType: PagingNodeType,
    projectId: string;
    scanFileId: string;
    scanTaskId?: string;
    dsrType?: DsrType;
}
