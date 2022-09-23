import * as vscode from 'vscode';

class Channel implements vscode.Disposable {
    private readonly defaultChannel: vscode.OutputChannel = vscode.window.createOutputChannel("xcalscan");
    private readonly scanProgressChannel: vscode.OutputChannel = vscode.window.createOutputChannel("xcalscan.扫描进度");
    private readonly scanSummaryChannel: vscode.OutputChannel = vscode.window.createOutputChannel("xcalscan.扫描结果");

    private getChannel(type: ChannelType): vscode.OutputChannel {
        let _channel: vscode.OutputChannel;

        switch (type) {
            case ChannelType.scanProgress:
                _channel = this.scanProgressChannel;
                break;
            case ChannelType.scanSummary:
                _channel = this.scanSummaryChannel;
                break;
            default:
                _channel = this.defaultChannel;
                break;
        }
        return _channel;
    }

    public appendLine(message: string, channelType: ChannelType): void {
        this.getChannel(channelType).appendLine(message);
    }

    public append(message: string, channelType: ChannelType): void {
        this.getChannel(channelType).append(message);
    }

    public show(channelType: ChannelType): void {
        this.getChannel(channelType).show();
    }

    public clear(channelType: ChannelType): void {
        this.getChannel(channelType).clear();
    }

    public dispose(): void {
        this.defaultChannel.dispose();
        this.scanProgressChannel.dispose();
        this.scanSummaryChannel.dispose();
    }
}

export enum ChannelType {
    default = 0,
    scanProgress = 1,
    scanSummary = 2
}

export const channel: Channel = new Channel();
