import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import utils from '../utils';

class VsDocumentManager {

    /**
     * Jump to the definition of a specific var / function
     * @param filepath A file system or UNC path.
     * @param lineno  A zero-based line value
     * @param keyWord Var or function
     */
    goToDefinition(filepath: string, lineno: number, keyWord: string | undefined) {
        let file = vscode.Uri.file(filepath);
        let line = lineno - 1;
        vscode.workspace.openTextDocument(file).then(function (document) {
            vscode.window.showTextDocument(document, { preview: false }).then((editor) => {
                if(line < 0) {
                    return;
                }

                //Highlight the line
                let startColume = 0;
                let endColume = 0;
                let lineText = editor.document.lineAt(line).text;
                startColume = 0;
                endColume = lineText.length;

                // highlight the keyword (disable)
                /*
                if (keyWord && keyWord.length > 0) {
                    let lineText = editor.document.lineAt(line).text;
                    startColume = lineText.indexOf(keyWord);
                    endColume = lineText.indexOf(keyWord) + keyWord.length;
                    if (startColume < 0) {
                        startColume = 0;
                        endColume = lineText.length;
                    }
                } else {
                    let lineText = editor.document.lineAt(line).text;
                    startColume = 0;
                    endColume = lineText.length;
                }
                */

                let start = new vscode.Position(line, startColume);
                let end = new vscode.Position(line, endColume);
                let range = new vscode.Range(start, end);

                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                editor.selection = new vscode.Selection(start, end);
            });
        });
    }

    /**
     * Find the source file in user workspace
     * @param filePath A path to a file.
     */
    searchFilePosition(filePath: string): string | undefined {
        let num = 0;
        let pathArray: string[] = filePath.split(path.sep);
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders && workspaceFolders.length > 0) {
            while (num < pathArray.length) {
                for (let workDir of workspaceFolders) {
                    let rootPath = utils.os.isWindows() ? workDir.uri.fsPath : workDir.uri.path;
                    let newArray = pathArray.slice(num, pathArray.length);
                    let destPath = path.join(rootPath, newArray.join(path.sep));
                    if (fs.existsSync(destPath)) {
                        return destPath;
                    }
                }
                num++;
            }
        }
        return undefined;
    }

    /**
     * Find the workspaceFolder object in user workspace
     * @param folderPath A path to a folder.
     */
    getWorkspaceFolder(folderPath: string): vscode.WorkspaceFolder | undefined {
        let workspaceFolder: vscode.WorkspaceFolder | undefined = undefined;
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders) {
            if (workspaceFolders.length === 1) {

                workspaceFolder = workspaceFolders[0];

            } else if (workspaceFolders.length > 1) {

                workspaceFolders.forEach(folder => {
                    if (folder.uri.fsPath === folderPath){
                        workspaceFolder = folder;
                    }
                });
            }
        }

        return workspaceFolder;
    }
}

export default new VsDocumentManager();
