import * as open from "open";
import logger from '../utils/logger';
import { ProjectTreeNode } from '../model/projectTreeNode';
import configurationManager from '../dataManager/configurationManager';

export const openScanResultWithBrowser = (element: ProjectTreeNode) => {
    if(element.projectKey) {
        const serverAddress = configurationManager.getConfiguration().serverAddress;
        const scanResultUrl = `${serverAddress}/project/${element.projectKey}`;
        open(scanResultUrl);
    } else {
        logger.warn('Failed to open scan result page in browser.Project key does not exist.');
    }
}