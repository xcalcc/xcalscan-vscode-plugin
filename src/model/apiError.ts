export default interface IApiError {
    error: any,
}

export function isApiError(obj: IApiError | any): obj is IApiError {
    return (<IApiError>obj).error !== undefined;
}