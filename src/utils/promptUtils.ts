import * as vscode from 'vscode';

export function showInformationMessage(message: string) {
    vscode.window.showInformationMessage(message);
}

export function showWarningMessage(message: string) {
    vscode.window.showWarningMessage(message);
}

export function showErrorMessage(message: string) {
    vscode.window.showErrorMessage(message);
}