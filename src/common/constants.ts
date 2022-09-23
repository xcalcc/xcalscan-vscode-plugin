export const ISSUE_PAGING_SIZE = 100;
export const ISSUE_TRACE_PATH_PAGING_SIZE = 100;
export const UPLOAD_SOURCE_CODE_DEFAULT = false;

export const PLUGIN_LANGUAGE = {
    en: 'en',
    zhCN: 'zh-CN'
};

export const PROJECT_LANGUAGE = {
    cplus: 'c++',
    java: 'java'
};

export const SCAN_TASK_STATUS = {
    pending: 'PENDING',
    processing: 'PROCESSING',
    completed: 'COMPLETED',
    failed: 'FAILED',
    terminated: 'TERMINATED'
};

export const ISSUE_PRIORITY = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW'
};

export const RULE_SET = {
    BUILTIN: 'Xcalibyte',
    builtin: 'SpotBugs'
};

export const API_UNIFY_ERROR_CODE = {
    SCANTASKSTATUS_UPDATE_VALIDATE_FAIL: '0x8136031B'
};

export const CACHE_TYPE = {
    RULE_SETS: 'RULE_SETS',
    RULE_LIST: 'RULE_LIST',
    RULE_STANDARDS: 'RULE_STANDARDS',
    PATH_MSG_LIST: 'PATH_MSG_LIST',
    USERNAME: 'USERNAME',
    PASSWORD: 'PASSWORD'
};

export const RULE_MSG_TEMPL_KEYWORDS = {
    source: {
        file: '${so.file}',
        filename: '${so.filename}',
        func: '${so.func}',
        variable: '${so.var}',
        line: '${so.line}',
    },
    sink: {
        file: '${si.file}',
        filename: '${si.filename}',
        func: '${si.func}',
        variable: '${si.var}',
        line: '${si.line}',
    }
};

export const XCALSCAN_FILES = {
    SCAN_CONFIG_FILE: 'xcalscan.conf'
}