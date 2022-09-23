import * as vscode from 'vscode';

interface IHoverData {
    filePath: string,
    lineNo: number,
    message: string
}

/**
 * Register a hover provider to display defect messages.
 */
class HoverManager {
    private hoverDataList: Array<IHoverData> = [];

    public register(filePath: string, lineNo: number, message: string) {

        //Save the hover event registration record
        let hasRegister = this.hoverDataList.find(x => x.filePath === filePath && x.lineNo === lineNo && x.message === message);

        //Prevent duplicate registration hover events
        if(!hasRegister){
            this.hoverDataList.push({
                filePath,
                lineNo,
                message
            });

            vscode.languages.registerHoverProvider({
                scheme: 'file', 
                pattern: filePath 
            }, {
                provideHover(document, position, token): vscode.ProviderResult<vscode.Hover>  {
                    let hoverLine = position.line;
                    if(lineNo === hoverLine + 1) {
                        return new vscode.Hover(message);
                    }
                }
            });
        }
    }
}

export const hoverManager: HoverManager = new HoverManager();