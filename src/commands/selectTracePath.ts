import IIssueTracePathNode from '../model/issueTracePathNode';
import IIssueTracePath from '../model/issueTracePath';
import vsDocumentManager from '../dataManager/vsDocumentManager';
import { hoverManager } from '../dataManager/hoverManager';

export async function selectTracePath(issueTracePath: IIssueTracePath){
    //Displays all message of the trace path
    let tracePathNodes: Array<IIssueTracePathNode> = issueTracePath.tracePathNodes;

    tracePathNodes.forEach(pathNode => {
        let localPath = vsDocumentManager.searchFilePosition(pathNode.file);
        if(localPath) {
            hoverManager.register(localPath, pathNode.lineNo, pathNode._message);
        }
    });
}