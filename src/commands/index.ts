import { login } from './login';
import { search } from './search';
import { gotoSetting } from './gotoSetting';
import { setServer } from './setServer';
import { setClient } from './setClient';
import { createProject } from './createProject';
import { linkWithProject } from './linkWithProject';
import { toggleDsrView } from './toggleDsrView';
import { viewScanResult } from './viewScanResult';
import { selectCommitId } from './selectCommitId';
import { selectIssueFile } from './selectIssueFile';
import { selectTracePath } from './selectTracePath';
import { selectTracePathNode } from './selectTracePathNode';
import { viewReadme } from './viewReadme';
import { createOrScan } from './scan';
import { unlinkProject } from './unlinkProject';
import { openScanResultWithBrowser } from './openScanResultWithBrowser';
import { pagingForIssue } from './pagingForIssue';
import { pagingForIssueTrace } from './pagingForIssueTrace';

export default {
    login,
    search,
    gotoSetting,
    setServer,
    setClient,
    createProject,
    linkWithProject,
    toggleDsrView,
    viewScanResult,
    selectCommitId,
    selectIssueFile,
    selectTracePath,
    selectTracePathNode,
    viewReadme,
    createOrScan,
    unlinkProject,
    openScanResultWithBrowser,
    pagingForIssue,
    pagingForIssueTrace
};