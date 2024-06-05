export interface User {
    username: string;
    email: string;
    collections: string[];
    sets: string[];
}

export interface UserFull extends User {
    password: string;
    sessions: string[];
}

export interface Collection {
    name: string;
    description: string;
    public: boolean;
    author: string;
    cards: string[][];
    version: number;
    sets: string[];
}

export interface LearningSet {
    name: string;
    description: string;
    version: number;
    author: string;
    collections: string[];
    public: boolean;
}
