import DsrType from './dsrType';

export default interface IIssueDsrCategory {
    label: string,
    value: string,
    issueCount: number | undefined,
    dsrType: DsrType
}