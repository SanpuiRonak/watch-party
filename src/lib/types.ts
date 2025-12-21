export interface User {
  id: string;
  username: string;
}

export interface VideoState {
  lastEventTime: number;
  lastEventTimestamp: number;
  isPlaying: boolean;
  playbackRate: number;
}

export interface RoomPermissions {
  canPlay: boolean;
  canSeek: boolean;
}

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  streamUrl: string;
  videoState: VideoState;
  permissions: RoomPermissions;
  participants: string[];
  createdAt: number;
}

export interface CreateRoomRequest {
  roomName: string;
  streamUrl: string;
  ownerId: string;
}

export type SocketEvents = {
  'join-room': (roomId: string, userId: string) => void;
  'leave-room': (roomId: string, userId: string) => void;
  'video-event': (roomId: string, eventType: 'play' | 'pause' | 'seek', currentTime: number) => void;
  'room-state': (room: Room) => void;
  'video-sync': (videoState: VideoState) => void;
  'error': (message: string) => void;
};