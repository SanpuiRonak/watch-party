import { describe, expect, it } from "vitest";
import roomReducer, {
    clearRoom,
    setConnected,
    setRoom,
    updateVideoState,
} from "@/lib/store/slices/roomSlice";
import type { Room, VideoState } from "@/lib/types";

describe("Room Slice", () => {
    const initialState = {
        currentRoom: null,
        serverVideoState: null,
        isConnected: false,
    };

    const mockVideoState: VideoState = {
        currentTime: 120,
        lastUpdated: 1234567890,
        isPlaying: true,
        playbackRate: 1.5,
    };

    const mockRoom: Room = {
        id: "room123",
        name: "Test Room",
        ownerId: "user123",
        ownerName: "Test User",
        streamUrl: "https://example.com/video.mp4",
        videoState: mockVideoState,
        permissions: {
            canPlay: true,
            canSeek: false,
            canChangeSpeed: true,
        },
        participants: [
            { id: "user123", username: "Test User" },
            { id: "user456", username: "Another User" },
        ],
        createdAt: 1234567890,
    };

    const updatedVideoState: VideoState = {
        currentTime: 240,
        lastUpdated: 1234567900,
        isPlaying: false,
        playbackRate: 2.0,
    };

    describe("Initial State", () => {
        it("should return the initial state", () => {
            expect(roomReducer(undefined, { type: undefined })).toEqual(initialState);
        });
    });

    describe("setRoom", () => {
        it("should set the current room and server video state", () => {
            const action = setRoom(mockRoom);
            const result = roomReducer(initialState, action);

            expect(result.currentRoom).toEqual(mockRoom);
            expect(result.serverVideoState).toEqual(mockVideoState);
            expect(result.isConnected).toBe(false); // unchanged
        });

        it("should update room when one already exists", () => {
            const existingState = {
                ...initialState,
                currentRoom: { ...mockRoom, name: "Old Room" },
                serverVideoState: { ...mockVideoState, currentTime: 60 },
            };

            const newRoom = { ...mockRoom, name: "New Room" };
            const action = setRoom(newRoom);
            const result = roomReducer(existingState, action);

            expect(result.currentRoom).toEqual(newRoom);
            expect(result.serverVideoState).toEqual(mockVideoState);
        });
    });

    describe("updateVideoState", () => {
        it("should update server video state when no room exists", () => {
            const action = updateVideoState(updatedVideoState);
            const result = roomReducer(initialState, action);

            expect(result.serverVideoState).toEqual(updatedVideoState);
            expect(result.currentRoom).toBeNull();
        });

        it("should update both server video state and current room's video state", () => {
            const stateWithRoom = {
                ...initialState,
                currentRoom: mockRoom,
            };

            const action = updateVideoState(updatedVideoState);
            const result = roomReducer(stateWithRoom, action);

            expect(result.serverVideoState).toEqual(updatedVideoState);
            expect(result.currentRoom).not.toBeNull();
            expect(result.currentRoom?.videoState).toEqual(updatedVideoState);
        });

        it("should update server video state when room exists but preserve other room properties", () => {
            const stateWithRoom = {
                ...initialState,
                currentRoom: mockRoom,
            };

            const action = updateVideoState(updatedVideoState);
            const result = roomReducer(stateWithRoom, action);

            expect(result.currentRoom?.id).toBe(mockRoom.id);
            expect(result.currentRoom?.name).toBe(mockRoom.name);
            expect(result.currentRoom?.participants).toEqual(mockRoom.participants);
            expect(result.currentRoom?.videoState).toEqual(updatedVideoState);
        });
    });

    describe("setConnected", () => {
        it("should set isConnected to true", () => {
            const action = setConnected(true);
            const result = roomReducer(initialState, action);

            expect(result.isConnected).toBe(true);
            expect(result.currentRoom).toBeNull();
            expect(result.serverVideoState).toBeNull();
        });

        it("should set isConnected to false", () => {
            const connectedState = {
                ...initialState,
                isConnected: true,
            };

            const action = setConnected(false);
            const result = roomReducer(connectedState, action);

            expect(result.isConnected).toBe(false);
        });

        it("should not affect other state properties", () => {
            const stateWithRoom = {
                ...initialState,
                currentRoom: mockRoom,
                serverVideoState: mockVideoState,
            };

            const action = setConnected(true);
            const result = roomReducer(stateWithRoom, action);

            expect(result.currentRoom).toEqual(mockRoom);
            expect(result.serverVideoState).toEqual(mockVideoState);
            expect(result.isConnected).toBe(true);
        });
    });

    describe("clearRoom", () => {
        it("should reset all state to initial values", () => {
            const fullState = {
                currentRoom: mockRoom,
                serverVideoState: mockVideoState,
                isConnected: true,
            };

            const action = clearRoom();
            const result = roomReducer(fullState, action);

            expect(result).toEqual(initialState);
        });

        it("should work when state is already empty", () => {
            const action = clearRoom();
            const result = roomReducer(initialState, action);

            expect(result).toEqual(initialState);
        });

        it("should work when only some properties are set", () => {
            const partialState = {
                currentRoom: mockRoom,
                serverVideoState: null,
                isConnected: true,
            };

            const action = clearRoom();
            const result = roomReducer(partialState, action);

            expect(result).toEqual(initialState);
        });
    });

    describe("State Transitions", () => {
        it("should handle a complete room lifecycle", () => {
            // Start empty
            let state = roomReducer(undefined, { type: undefined });
            expect(state).toEqual(initialState);

            // Join room
            state = roomReducer(state, setRoom(mockRoom));
            expect(state.currentRoom).toEqual(mockRoom);
            expect(state.serverVideoState).toEqual(mockVideoState);

            // Connect
            state = roomReducer(state, setConnected(true));
            expect(state.isConnected).toBe(true);

            // Update video state
            state = roomReducer(state, updateVideoState(updatedVideoState));
            expect(state.serverVideoState).toEqual(updatedVideoState);
            expect(state.currentRoom?.videoState).toEqual(updatedVideoState);

            // Disconnect
            state = roomReducer(state, setConnected(false));
            expect(state.isConnected).toBe(false);

            // Leave room
            state = roomReducer(state, clearRoom());
            expect(state).toEqual(initialState);
        });
    });
});
