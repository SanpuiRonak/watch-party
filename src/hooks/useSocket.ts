"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { socketManager } from "@/lib/socket";
import { useAppDispatch } from "@/lib/store";
import { setConnected, setRoom, updateVideoState } from "@/lib/store/slices/roomSlice";
import { logger } from "@/lib/utils/logger";
import { Room, RoomPermissions, VideoState } from "@/lib/types";

export const useSocket = (roomId: string, userId: string, username: string) => {
    const dispatch = useAppDispatch();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = socketManager.connect();
        socketRef.current = socket;

        socket.emit("join-room", roomId, userId, username);

        socket.on("room-state", (room: Room) => {
            logger.debug("Received room state update", {
                participantsCount: room.participants.length,
                participants: room.participants.map(p => p.username),
                permissions: room.permissions,
            });
            dispatch(setRoom(room));
            dispatch(setConnected(true));
        });

        socket.on("video-sync", (videoState: VideoState) => {
            dispatch(updateVideoState(videoState));
        });

        socket.on("participant-joined", (participant: { id: string; username: string }) => {
            logger.info("Participant joined", participant);
            // Room state will be updated by the server automatically
        });

        socket.on("participant-left", (participant: { id: string; username: string }) => {
            logger.info("Participant left", participant);
            // Room state will be updated by the server automatically
        });

        socket.on("error", (message: string) => {
            logger.error("Socket error:", message);
            dispatch(setConnected(false));
        });

        socket.on("connect", () => {
            dispatch(setConnected(true));
        });

        socket.on("disconnect", () => {
            dispatch(setConnected(false));
        });

        return () => {
            socket.off("room-state");
            socket.off("video-sync");
            socket.off("participant-joined");
            socket.off("participant-left");
            socket.off("error");
            socket.off("connect");
            socket.off("disconnect");
            socket.emit("leave-room", roomId, userId, username);
        };
    }, [roomId, userId, username, dispatch]);

    const emitVideoEvent = (
        eventType: "play" | "pause" | "seek",
        currentTime: number,
        playbackRate?: number,
    ) => {
        logger.debug("[useSocket] Emitting video event", {
            eventType,
            userId,
            playbackRate,
        });
        if (socketRef.current) {
            socketRef.current.emit(
                "video-event",
                roomId,
                eventType,
                currentTime,
                userId,
                playbackRate,
            );
        }
    };

    const emitPermissionsUpdate = (permissions: RoomPermissions) => {
        logger.debug("[useSocket] Emitting permissions update", permissions);
        if (socketRef.current) {
            socketRef.current.emit("permissions-update", roomId, permissions);
        }
    };

    return { emitVideoEvent, emitPermissionsUpdate };
};
