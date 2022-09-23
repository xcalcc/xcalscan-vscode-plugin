import * as vscode from 'vscode';
import panelManager from '../webview/panelManager';
import { getWebViewContentUtils } from '../utils/getWebViewContentUtils';

export async function viewReadme(context: vscode.ExtensionContext){
    const htmlContent = getWebViewContentUtils(context, 'about.html');
    panelManager.showWebview('About', htmlContent, false);
}