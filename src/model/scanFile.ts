export default interface IScanFile {
    id: string,
    parentPath: string,
    projectRelativePath: string,
    status: string,
    storePath: string,
    depth: number,
    treeLeft: number,
    treeRight: number,
    type: string
}