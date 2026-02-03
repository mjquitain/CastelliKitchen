export interface User {
    userID: string;
    username: string;
    firstname?: string;
    lastname?: string;
    email: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}