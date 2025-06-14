export interface User {
    name: string;
    uuid: string;
    avatar?: string;
}

export interface Room {
    name: string;
    uuid: string;
    streamLink: string;
}