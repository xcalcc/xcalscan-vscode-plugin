import http from "./httpService";
import apiConfig from './apiConfig';

export function getRuleSets() {
    return http.get(`${apiConfig.ruleService}/rule/rule_sets`);
}

export function getRuleStandards() {
    return http.get(`${apiConfig.ruleService}/rule/standards`);
}

export function getRuleList() {
    return http.get(`${apiConfig.ruleService}/rule/rule_list`);
}

export function getPathMsg() {
    return http.get(`${apiConfig.ruleService}/rule/path_msg`);
}

export default {
    getRuleSets,
    getRuleStandards,
    getRuleList,
    getPathMsg
};