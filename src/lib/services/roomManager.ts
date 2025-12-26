import { Participant, Room, RoomPermissions, VideoState } from "../types";
import { connectToDatabase } from "./mongodb";
import {
    sanitizeRoomName,
    sanitizeUsername,
    secureLogger,
    validatePermissions,
    validateRoomId,
    validateStreamUrlFormat,
    validateUserId,
} from "../utils/security";

export class RoomManager {
    private async getCollection() {
        const { db } = await connectToDatabase();
        return db.collection("rooms");
    }

    async createRoom(
        id: string,
        name: string,
        streamUrl: string,
        ownerId: string,
        ownerName: string,
    ): Promise<Room> {
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
                playbackRate: 1,
            },
            permissions: {
                canPlay: true,
                canSeek: true,
                canChangeSpeed: true,
            },
            createdAt: Date.now(),
        };

        const collection = await this.getCollection();
        await collection.insertOne(room);
        secureLogger.roomAction("Room created", sanitizedId);
        return room;
    }

    async getRoom(roomId: string): Promise<Room | null> {
        // Validate roomId to prevent NoSQL injection
        const sanitizedId = validateRoomId(roomId);

        const collection = await this.getCollection();
        const room = await collection.findOne({ id: sanitizedId });
        return room ? (room as unknown as Room) : null;
    }

    async addParticipant(roomId: string, userId: string, username: string): Promise<Room | null> {
        // Validate and sanitize all inputs
        const sanitizedRoomId = validateRoomId(roomId);
        const sanitizedUserId = validateUserId(userId);
        const sanitizedUsername = sanitizeUsername(username);

        const collection = await this.getCollection();
        const room = await collection.findOne({ id: sanitizedRoomId });

        if (!room) {
            secureLogger.roomAction("Room not found", sanitizedRoomId);
            return null;
        }

        // Check if participant already exists
        const existingParticipant = room.participants.find(
            (p: Participant) => p.id === sanitizedUserId,
        );
        if (existingParticipant) {
            secureLogger.roomAction(
                "Participant already in room",
                sanitizedRoomId,
                sanitizedUserId,
            );
            return room as unknown as Room;
        }

        // Add new participant
        const updatedRoom = await collection.findOneAndUpdate(
            { id: sanitizedRoomId },
            {
                $push: { participants: { id: sanitizedUserId, username: sanitizedUsername } },
            },
            { returnDocument: "after" },
        );

        secureLogger.roomAction("Added participant", sanitizedRoomId, sanitizedUserId);
        return updatedRoom ? (updatedRoom as unknown as Room) : null;
    }

    async removeParticipant(roomId: string, userId: string): Promise<Room | null> {
        // Validate inputs to prevent NoSQL injection
        const sanitizedRoomId = validateRoomId(roomId);
        const sanitizedUserId = validateUserId(userId);

        const collection = await this.getCollection();
        const updatedRoom = await collection.findOneAndUpdate(
            { id: sanitizedRoomId },
            { $pull: { participants: { id: sanitizedUserId } } },
            { returnDocument: "after" },
        );

        secureLogger.roomAction("Removed participant", sanitizedRoomId, sanitizedUserId);
        return updatedRoom ? (updatedRoom as unknown as Room) : null;
    }

    async updateVideoState(
        roomId: string,
        eventType: "play" | "pause" | "seek",
        currentTime: number,
        playbackRate = 1,
    ): Promise<VideoState | null> {
        // Validate inputs (note: eventType, currentTime, and playbackRate are validated in server.ts)
        const sanitizedRoomId = validateRoomId(roomId);

        const videoState: VideoState = {
            isPlaying: eventType === "play",
            currentTime,
            lastUpdated: Date.now(),
            playbackRate,
        };

        const collection = await this.getCollection();
        await collection.updateOne({ id: sanitizedRoomId }, { $set: { videoState } });

        secureLogger.roomAction(
            `Video ${eventType} at ${currentTime}s, rate ${playbackRate}x`,
            sanitizedRoomId,
        );
        return videoState;
    }

    async updatePermissions(roomId: string, permissions: RoomPermissions): Promise<Room | null> {
        // Validate inputs to prevent NoSQL injection
        const sanitizedRoomId = validateRoomId(roomId);
        const validatedPermissions = validatePermissions(permissions);

        secureLogger.debug(
            "[RoomManager] Updating permissions for room:",
            sanitizedRoomId,
            validatedPermissions,
        );

        const collection = await this.getCollection();
        const updatedRoom = await collection.findOneAndUpdate(
            { id: sanitizedRoomId },
            { $set: { permissions: validatedPermissions } },
            { returnDocument: "after" },
        );

        if (updatedRoom) {
            secureLogger.debug(
                "[RoomManager] Successfully updated permissions:",
                updatedRoom.permissions,
            );
        } else {
            secureLogger.roomAction(
                "Failed to update permissions - room not found",
                sanitizedRoomId,
            );
        }

        return updatedRoom ? (updatedRoom as unknown as Room) : null;
    }

    async deleteRoom(roomId: string): Promise<boolean> {
        // Validate roomId to prevent NoSQL injection
        const sanitizedRoomId = validateRoomId(roomId);

        const collection = await this.getCollection();
        const result = await collection.deleteOne({ id: sanitizedRoomId });
        secureLogger.roomAction("Deleted room", sanitizedRoomId);
        return result.deletedCount > 0;
    }
}
