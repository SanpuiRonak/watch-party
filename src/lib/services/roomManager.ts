import { Room, Participant, VideoState, RoomPermissions } from '../types';
import { connectToDatabase } from './mongodb';

export class RoomManager {
  private async getCollection() {
    const { db } = await connectToDatabase();
    return db.collection('rooms');
  }

  async createRoom(id: string, name: string, streamUrl: string, ownerId: string, ownerName: string): Promise<Room> {
    const room: Room = {
      id,
      name,
      streamUrl,
      ownerId,
      ownerName,
      participants: [{ id: ownerId, username: ownerName }],
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
    console.log(`Room created: ${id}`);
    return room;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const collection = await this.getCollection();
    const room = await collection.findOne({ id: roomId });
    return room ? (room as any) : null;
  }

  async addParticipant(roomId: string, userId: string, username: string): Promise<Room | null> {
    const collection = await this.getCollection();
    const room = await collection.findOne({ id: roomId });
    
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return null;
    }

    // Check if participant already exists
    const existingParticipant = room.participants.find((p: Participant) => p.id === userId);
    if (existingParticipant) {
      console.log(`Participant ${username} already in room ${roomId}`);
      return room as any;
    }

    // Add new participant
    const updatedRoom = await collection.findOneAndUpdate(
      { id: roomId },
      { $push: { participants: { id: userId, username } } } as any,
      { returnDocument: 'after' }
    );

    console.log(`Added participant ${username} to room ${roomId}`);
    return updatedRoom as any;
  }

  async removeParticipant(roomId: string, userId: string): Promise<Room | null> {
    const collection = await this.getCollection();
    const updatedRoom = await collection.findOneAndUpdate(
      { id: roomId },
      { $pull: { participants: { id: userId } } } as any,
      { returnDocument: 'after' }
    );

    console.log(`Removed participant ${userId} from room ${roomId}`);
    return updatedRoom as any;
  }

  async updateVideoState(roomId: string, eventType: 'play' | 'pause' | 'seek', currentTime: number, playbackRate: number = 1): Promise<VideoState | null> {
    const videoState: VideoState = {
      isPlaying: eventType === 'play',
      currentTime,
      lastUpdated: Date.now(),
      playbackRate
    };

    const collection = await this.getCollection();
    await collection.updateOne(
      { id: roomId },
      { $set: { videoState } } as any
    );

    console.log(`Updated video state for room ${roomId}: ${eventType} at ${currentTime}s, rate ${playbackRate}x`);
    return videoState;
  }

  async updatePermissions(roomId: string, permissions: RoomPermissions): Promise<Room | null> {
    console.log('[RoomManager] Updating permissions for room:', roomId, permissions);
    
    const collection = await this.getCollection();
    const updatedRoom = await collection.findOneAndUpdate(
      { id: roomId },
      { $set: { permissions } } as any,
      { returnDocument: 'after' }
    );

    if (updatedRoom) {
      console.log('[RoomManager] Successfully updated permissions:', updatedRoom.permissions);
    } else {
      console.log('[RoomManager] Failed to update permissions - room not found');
    }
    
    return updatedRoom as any;
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ id: roomId });
    console.log(`Deleted room ${roomId}`);
    return result.deletedCount > 0;
  }
}