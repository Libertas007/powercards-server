export interface User {
    username: string;
    email: string;
    collections: string[];
}

export interface UserFull extends User {
    password: string;
    sessions: string[];
}
