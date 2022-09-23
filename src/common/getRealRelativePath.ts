import * as path from 'path';

/**
 * Add the folder name of the project to relativePath
 *
 * @param scanFilePath A absolute path of the file.
 * @param relativePath A relative path of file.
 */
export const getRealRelativePath = (scanFilePath: string, relativePath: string) => {
    // const projectFolderPath: string[] = scanFilePath.replace(relativePath, '').split('/');
    // const projectFolderName = projectFolderPath.filter(x=>!!x).pop() || '';
    // return path.join(projectFolderName, relativePath);
    return relativePath;
};