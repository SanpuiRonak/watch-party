"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const mongodb_1 = require("./mongodb");
class RoomManager {
    async getCollection() {
        const { db } = await (0, mongodb_1.connectToDatabase)();
        return db.collection('rooms');
    }
    async createRoom(id, name, streamUrl, ownerId, ownerName) {
        const room = {
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
    async getRoom(roomId) {
        const collection = await this.getCollection();
        const room = await collection.findOne({ id: roomId });
        return room ? room : null;
    }
    async addParticipant(roomId, userId, username) {
        const collection = await this.getCollection();
        const room = await collection.findOne({ id: roomId });
        if (!room) {
            console.log(`Room ${roomId} not found`);
            return null;
        }
        // Check if participant already exists
        const existingParticipant = room.participants.find((p) => p.id === userId);
        if (existingParticipant) {
            console.log(`Participant ${username} already in room ${roomId}`);
            return room;
        }
        // Add new participant
        const updatedRoom = await collection.findOneAndUpdate({ id: roomId }, { $push: { participants: { id: userId, username } } }, { returnDocument: 'after' });
        console.log(`Added participant ${username} to room ${roomId}`);
        return updatedRoom;
    }
    async removeParticipant(roomId, userId) {
        const collection = await this.getCollection();
        const updatedRoom = await collection.findOneAndUpdate({ id: roomId }, { $pull: { participants: { id: userId } } }, { returnDocument: 'after' });
        console.log(`Removed participant ${userId} from room ${roomId}`);
        return updatedRoom;
    }
    async updateVideoState(roomId, eventType, currentTime, playbackRate = 1) {
        const videoState = {
            isPlaying: eventType === 'play',
            currentTime,
            lastUpdated: Date.now(),
            playbackRate
        };
        const collection = await this.getCollection();
        await collection.updateOne({ id: roomId }, { $set: { videoState } });
        console.log(`Updated video state for room ${roomId}: ${eventType} at ${currentTime}s, rate ${playbackRate}x`);
        return videoState;
    }
    async updatePermissions(roomId, permissions) {
        console.log('[RoomManager] Updating permissions for room:', roomId, permissions);
        const collection = await this.getCollection();
        const updatedRoom = await collection.findOneAndUpdate({ id: roomId }, { $set: { permissions } }, { returnDocument: 'after' });
        if (updatedRoom) {
            console.log('[RoomManager] Successfully updated permissions:', updatedRoom.permissions);
        }
        else {
            console.log('[RoomManager] Failed to update permissions - room not found');
        }
        return updatedRoom;
    }
    async deleteRoom(roomId) {
        const collection = await this.getCollection();
        const result = await collection.deleteOne({ id: roomId });
        console.log(`Deleted room ${roomId}`);
        return result.deletedCount > 0;
    }
}
exports.RoomManager = RoomManager;
