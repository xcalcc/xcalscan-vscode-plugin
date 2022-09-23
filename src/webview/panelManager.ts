import * as vscode from 'vscode';

class PanelManager implements vscode.Disposable {
    private readonly viewType: string = "xcalscan.webview";
    private panel: vscode.WebviewPanel | undefined = undefined;

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    /**
     * Create a webview window
     * @param title title
     * @param content HTML text
     * @param isSideMode display in the side
     */
    public showWebview(title: string, content: string, isSideMode: boolean): void {
        if(this.panel) {
            this.panel.title = title;
        } else {
            this.panel = vscode.window.createWebviewPanel(
                this.viewType,
                title,
                {
                    viewColumn: isSideMode ? vscode.ViewColumn.Two : vscode.ViewColumn.One,
                    preserveFocus: true
                }
            );

            this.panel.onDidDispose(this.onDidDisposeWebview, this);
        }

        this.panel.webview.html = content;
    }

    private onDidDisposeWebview(): void {
        this.panel = undefined;
    }
}

export default new PanelManager();