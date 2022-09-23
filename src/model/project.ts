import IProjectConfig from './projectConfig';

export interface IProject {
	id: string;
	projectId: string;
	name: string;
	status: string;
	projectConfig: IProjectConfig;
	createdBy: string;
	createdOn: number;
	modifiedBy: string;
	modifiedOn: number;
}
