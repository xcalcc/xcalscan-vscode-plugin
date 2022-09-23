import { workspace, Uri, WorkspaceFolder, ExtensionContext } from 'vscode';
import { CACHE_TYPE } from '../common/constants';
import AuthService from '../service/authService';

class UserManager {
    private configuration(scope?: Uri | WorkspaceFolder) {
        return workspace.getConfiguration('xcalscan', scope);
    }

    public async login(userName: string, password: string): Promise<{tokenType: string, accessToken: string}> {
        return AuthService
                .login(userName, password)
                .then(response => {
                    return response.data || {};
                });
    }

    public isLogin(): boolean {
        const token: any = this.getToken();

        if (token.tokenType && token.accessToken) {
            return true;
        } else {
            return false;
        }
    }

    public async saveUserInfo(context: ExtensionContext, userName: string, password: string): Promise<void> {
        // await this.configuration().update('MandatoryUserName', userName, true);
        // await this.configuration().update('MandatoryUserPassword', String(password), true);
        context.globalState.update(CACHE_TYPE.USERNAME, userName);
        context.globalState.update(CACHE_TYPE.PASSWORD, password);
    }

    public getUserInfo(context: ExtensionContext) {
        // return {
        //     userName: this.configuration().get('MandatoryUserName'),
        //     password:  this.configuration().get('MandatoryUserPassword')
        // };
        return {
            userName: context.globalState.get<string>(CACHE_TYPE.USERNAME),
            password:  context.globalState.get<string>(CACHE_TYPE.PASSWORD)
        };
    }

    public async saveToken(tokenType: string, accessToken: string): Promise<void> {
        await this.configuration().update('OptionalServerAccessTokenType', tokenType, true);
        await this.configuration().update('OptionalServerAccessToken', accessToken, true);
    }

    public getToken() {
        return {
            tokenType: this.configuration().get('OptionalServerAccessTokenType'),
            accessToken: this.configuration().get('OptionalServerAccessToken')
        };
    }

    public async clearToken(): Promise<void> {
        await this.configuration().update('OptionalServerAccessTokenType', undefined, true);
        await this.configuration().update('OptionalServerAccessToken', undefined, true);
    }
}

export default new UserManager();