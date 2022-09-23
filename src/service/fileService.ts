import http from './httpService';

export function uploadFile(formData: any, config?: any){
    return http.post('/api/file_service/v2/file/file_info', formData, config);
}

export function getDirectoryTree({ depth, scanTaskId, types, scanFileIds, page, size }: { 
        depth: number, 
        scanTaskId: string, 
        types: string[],
        scanFileIds: string[] | undefined,
        page: number,
        size: number
}) {
    return http.post('/api/file_service/v2/scan_file', {
        depth,
        scanTaskId,
        types,
        scanFileIds
    }, {
        paramsSerializer: function () {
            let params = [];
            params.push(`page=${page}`);
            params.push(`size=${size}`);
            return params.join("&");
        }
    });
}

export default {
    uploadFile,
    getDirectoryTree
};