import * as vscode from 'vscode';
import * as cp from 'child_process';

interface IExecError extends Error {
    msg?: string;
    detail?: string;
}

export async function executeCommand(command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    return new Promise((
            resolve: (res: string) => void, 
            reject: ({code, error}: {code: number, error: IExecError}) => void
        ): void => {
        let result: string = '';

        const childProc: cp.ChildProcess = cp.spawn(command, args, { ...options });

        childProc.stdout?.on('data', (data: string | Buffer) => {
            result = result.concat(data.toString());
        });

        childProc.stderr?.on('data', (data: string | Buffer) => {
            result = result.concat(data.toString());
        });

        childProc.on('error', (err) => {
            reject({
                code: -1,
                error: {
                    ...err,
                    msg: 'Execute the function childProc.on("error")',
                    detail: result
                },
            });
        });

        childProc.on('close', (code: number) => {
            if (code !== 0) {
                const error: IExecError = new Error(`Command "${command} ${args.join(' ')}" failed with exit code "${code}".`);
                error.msg = 'Execute the function childProc.on("close")';
                error.detail = result;
                reject({ code, error });
            } else {
                resolve(result);
            }
        });
    });
}

export async function executeCommandWithProgress(message: string, command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    let result: string = '';
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (p: vscode.Progress<{}>) => {
        return new Promise(async (resolve, reject) => {
            p.report({ message });
            try {
                result = await executeCommand(command, args, options);
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    });
    return result;
}