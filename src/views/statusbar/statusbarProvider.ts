import { ExtensionContext, window, StatusBarItem, StatusBarAlignment, Disposable } from 'vscode';

export default class StatusbarProvider implements Disposable {

    private context: ExtensionContext;
    private readonly statusBarItem: StatusBarItem;

    constructor(context: ExtensionContext) {
        this.context = context;

        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10);
        this.statusBarItem.text = 'xcalscan';
        this.statusBarItem.command = {
            title: 'readme',
            command: 'xcalscan.readme',
            arguments: [context]
        };
    }

    public show(): void {
        this.statusBarItem.show();
    }

    public hide(): void {
        this.statusBarItem.hide();
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}