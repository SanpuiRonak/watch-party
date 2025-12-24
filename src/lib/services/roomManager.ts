import { Room, Participant, VideoState, RoomPermissions } from '../types';
import { connectToDatabase } from './mongodb';
import {
  validateRoomId,
  validateUserId,
  sanitizeUsername,
  sanitizeRoomName,
  validateStreamUrlFormat,
  validatePermissions,
  secureLogger
} from '../utils/security';

export class RoomManager {
  private async getCollection() {
    const { db } = await connectToDatabase();
    return db.collection('rooms');
  }

  async createRoom(id: string, name: string, streamUrl: string, ownerId: string, ownerName: string): Promise<Room> {
    // Validate and sanitize all inputs
    const sanitizedId = validateRoomId(id);
    const sanitizedName = sanitizeRoomName(name);
    const sanitizedStreamUrl = validateStreamUrlFormat(streamUrl);
    const sanitizedOwnerId = validateUserId(ownerId);
    const sanitizedOwnerName = sanitizeUsername(ownerName);

    const room: Room = {
      id: sanitizedId,
      name: sanitizedName,
      streamUrl: sanitizedStreamUrl,
      ownerId: sanitizedOwnerId,
      ownerName: sanitizedOwnerName,
      participants: [{ id: sanitizedOwnerId, username: sanitizedOwnerName }],
      videoState: {
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1
      },
      permissions: {
        canPlay: true,
        canSeek: true,
        canChangeSpeed: true
      },
      createdAt: Date.now()
    };

    const collection = await this.getCollection();
    await collection.insertOne(room);
    secureLogger.roomAction('Room created', sanitizedId);
    return room;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    // Validate roomId to prevent NoSQL injection
    const sanitizedId = validateRoomId(roomId);
    
    const collection = await this.getCollection();
    const room = await collection.findOne({ id: sanitizedId });
    return room ? (room as any) : null;
  }

  async addParticipant(roomId: string, userId: string, username: string): Promise<Room | null> {
    // Validate and sanitize all inputs
    const sanitizedRoomId = validateRoomId(roomId);
    const sanitizedUserId = validateUserId(userId);
    const sanitizedUsername = sanitizeUsername(username);
    
    const collection = await this.getCollection();
    const room = await collection.findOne({ id: sanitizedRoomId });
    
    if (!room) {
      secureLogger.roomAction('Room not found', sanitizedRoomId);
      return null;
    }

    // Check if participant already exists
    const existingParticipant = room.participants.find((p: Participant) => p.id === sanitizedUserId);
    if (existingParticipant) {
      secureLogger.roomAction('Participant already in room', sanitizedRoomId, sanitizedUserId);
      return room as any;
    }

    // Add new participant
    const updatedRoom = await collection.findOneAndUpdate(
      { id: sanitizedRoomId },
      { $push: { participants: { id: sanitizedUserId, username: sanitizedUsername } } } as any,
      { returnDocument: 'after' }
    );

    secureLogger.roomAction('Added participant', sanitizedRoomId, sanitizedUserId);
    return updatedRoom as any;
  }

  async removeParticipant(roomId: string, userId: string): Promise<Room | null> {
    // Validate inputs to prevent NoSQL injection
    const sanitizedRoomId = validateRoomId(roomId);
    const sanitizedUserId = validateUserId(userId);
    
    const collection = await this.getCollection();
    const updatedRoom = await collection.findOneAndUpdate(
      { id: sanitizedRoomId },
      { $pull: { participants: { id: sanitizedUserId } } } as any,
      { returnDocument: 'after' }
    );

    secureLogger.roomAction('Removed participant', sanitizedRoomId, sanitizedUserId);
    return updatedRoom as any;
  }

  async updateVideoState(roomId: string, eventType: 'play' | 'pause' | 'seek', currentTime: number, playbackRate: number = 1): Promise<VideoState | null> {
    // Validate inputs (note: eventType, currentTime, and playbackRate are validated in socket-server.ts)
    const sanitizedRoomId = validateRoomId(roomId);
    
    const videoState: VideoState = {
      isPlaying: eventType === 'play',
      currentTime,
      lastUpdated: Date.now(),
      playbackRate
    };

    const collection = await this.getCollection();
    await collection.updateOne(
      { id: sanitizedRoomId },
      { $set: { videoState } } as any
    );

    secureLogger.roomAction(`Video ${eventType} at ${currentTime}s, rate ${playbackRate}x`, sanitizedRoomId);
    return videoState;
  }

  async updatePermissions(roomId: string, permissions: RoomPermissions): Promise<Room | null> {
    // Validate inputs to prevent NoSQL injection
    const sanitizedRoomId = validateRoomId(roomId);
    const validatedPermissions = validatePermissions(permissions);
    
    secureLogger.debug('[RoomManager] Updating permissions for room:', sanitizedRoomId, validatedPermissions);
    
    const collection = await this.getCollection();
    const updatedRoom = await collection.findOneAndUpdate(
      { id: sanitizedRoomId },
      { $set: { permissions: validatedPermissions } } as any,
      { returnDocument: 'after' }
    );

    if (updatedRoom) {
      secureLogger.debug('[RoomManager] Successfully updated permissions:', updatedRoom.permissions);
    } else {
      secureLogger.roomAction('Failed to update permissions - room not found', sanitizedRoomId);
    }
    
    return updatedRoom as any;
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    // Validate roomId to prevent NoSQL injection
    const sanitizedRoomId = validateRoomId(roomId);
    
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ id: sanitizedRoomId });
    secureLogger.roomAction('Deleted room', sanitizedRoomId);
    return result.deletedCount > 0;
  }
}
