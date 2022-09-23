import { IProjectAttribute } from './projectAttribute'; 

export default interface IProjectConfig {
    id: string;
    name: string;
    attributes: IProjectAttribute[];
    status: string;
    createdBy: string;
    createdOn: number;
    modifiedBy: string;
    modifiedOn: number;
}