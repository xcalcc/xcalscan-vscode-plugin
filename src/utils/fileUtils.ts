import * as fs from 'fs';
import * as path from 'path';

export const mkdir = (dirPath: string, dirName?: string) => {
    if(!dirName) { 
        if(fs.existsSync(dirPath)) {
            return;
        }else{
            mkdir(dirPath, path.dirname(dirPath));
        }
    } else {
        if(dirName !== path.dirname(dirPath)) { 
            mkdir(dirPath);
            return;
        }
        if(fs.existsSync(dirName)) {
            fs.mkdirSync(dirPath)
        } else {
            mkdir(dirName, path.dirname(dirName));
            fs.mkdirSync(dirPath);
        }
    }
}

export const writeFileSync = (filePath: string, fileContent: string) => {
    if(fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, fileContent);
    } else {
        fs.appendFileSync(filePath, fileContent);
    }
}

export const readJsonSync = (filePath: string): Object | null => {
    if(!existsSync(filePath)) return null;

    let jsonData: Object | null = {};
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    try {
        jsonData = JSON.parse(fileContent);
    }
    catch(error) {
        jsonData = null;
    }

    return jsonData;
}

export const existsSync = (filePath: string) => {
    return fs.existsSync(filePath);
}