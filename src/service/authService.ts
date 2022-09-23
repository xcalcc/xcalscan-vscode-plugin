import http from './httpService';

export function login(username: string, password: string) {
    return http.post(
        '/api/auth_service/v2/login', {
            username,
            password
        }
    );
}

export default {
    login
};