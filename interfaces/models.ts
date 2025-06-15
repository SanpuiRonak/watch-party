export type User = {
    name: string;
    readonly uuid: string;
    avatar?: string;
}

export type Peer = {
    readonly peerId: string;
    readonly userData: User;
}

export type RoomMetaData = {
    name: string;
    readonly uuid: string;
    readonly streamLink: string;
    readonly ownerId: string;
}
