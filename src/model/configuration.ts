import * as URL from 'url';

export default class Configuration {
    serverPort: number;
    serverAddressWithoutPort: string;
    serverAddress: string;
    clientPath: string;
    language: string;

    constructor(
        serverAddress: string,
        clientPath: string,
        language: string,
    ){
        this.serverAddress = serverAddress;
        this.clientPath = clientPath;
        this.language = language;

        const url = URL.parse(this.serverAddress);
        this.serverPort = Number(url.port) || 80;
        this.serverAddressWithoutPort = `${url.protocol}//${url.hostname}` || '';
    }
}