import redis from '@/lib/redis';
import { Room, VideoState } from '@/lib/types';
import { createVideoEvent } from '@/lib/utils/videoSync';

export class RoomManager {
  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const data = await redis.get(`room:${roomId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }

  async updateRoom(room: Room): Promise<void> {
    try {
      await redis.setex(`room:${room.id}`, 86400, JSON.stringify(room));
    } catch (error) {
      console.error('Error updating room:', error);
    }
  }

  async updateVideoState(roomId: string, eventType: 'play' | 'pause' | 'seek', currentTime: number): Promise<VideoState | null> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return null;

      const videoState = createVideoEvent(eventType, currentTime);
      room.videoState = videoState;
      
      await this.updateRoom(room);
      return videoState;
    } catch (error) {
      console.error('Error updating video state:', error);
      return null;
    }
  }

  async addParticipant(roomId: string, userId: string, username: string): Promise<Room | null> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return null;

      const existingParticipant = room.participants.find(p => p.id === userId);
      if (!existingParticipant) {
        room.participants.push({ id: userId, username });
        await this.updateRoom(room);
      }
      
      return room;
    } catch (error) {
      console.error('Error adding participant:', error);
      return null;
    }
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return;

      room.participants = room.participants.filter(p => p.id !== userId);
      await this.updateRoom(room);
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  }

  async updatePermissions(roomId: string, permissions: { canPlay: boolean; canSeek: boolean; canChangeSpeed: boolean }): Promise<Room | null> {
    try {
      console.log('[RoomManager] Updating permissions for room:', roomId, permissions);
      const room = await this.getRoom(roomId);
      if (!room) {
        console.log('[RoomManager] Room not found:', roomId);
        return null;
      }

      console.log('[RoomManager] Current permissions:', room.permissions);
      room.permissions = permissions;
      console.log('[RoomManager] New permissions:', room.permissions);
      await this.updateRoom(room);
      console.log('[RoomManager] Room updated successfully');
      return room;
    } catch (error) {
      console.error('Error updating permissions:', error);
      return null;
    }
  }
}