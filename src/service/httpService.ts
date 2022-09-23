import * as vscode from 'vscode';
import axios from 'axios';
import utils from '../utils';
import logger from '../utils/logger';
import configurationManager from '../dataManager/configurationManager';
import userManager from '../dataManager/userManager';

axios.interceptors.request.use(
    config => {
        const correlationId = utils.uuid.uuid16();
        const token = userManager.getToken();
        config.headers["X-Platform"] = 'vscode';
        config.headers['Authorization'] = `${token.tokenType} ${token.accessToken}`;
        config.headers["X-B3-TraceId"] = correlationId;
        config.headers["X-B3-SpanId"] = correlationId;

        if(!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        let language = 'zh-CN';
        let params = config.params || {};
        params['locale'] = language;
        config.params = params;

        if(config.url){
            let serverAddress = configurationManager.getConfiguration().serverAddress;
            config.url = serverAddress + config.url;
        }

        if(config.paramsSerializer && config.url){
            let p = config.url.indexOf('?') > -1 ? '&' : '?';
            config.url = config.url + p + 'locale=' + language;
        }

        return config;
    }, 
    error => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    response => {
        return response;
    }, 
    error => {
        try{
            logger.error('[API ERROR] ' + JSON.stringify({
                config: error.response.config,
                data: error.response.data
            }));
        } 
        catch{}

        const expectedError = 
            error.response && 
            error.response.status >= 400 && 
            error.response.status < 500;

        if(expectedError) {
            if(error.response.status === 401){
                userManager.clearToken().then(data => {
                    vscode.commands.executeCommand('xcalscan.refreshMainTree');
                });
            }

            if(error.response.status === 403){
                // window.location = "/error";
            }
        }

        return Promise.reject(error);
    }
);

export default {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    delete: axios.delete
};
