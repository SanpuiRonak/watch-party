"use client";

import { RefObject, useEffect } from "react";
import { useAppSelector } from "@/lib/store";
import { getCurrentTime } from "@/lib/utils/videoSync";
import { logger } from "@/lib/utils/logger";

export const useVideoSync = (videoRef: RefObject<HTMLVideoElement>) => {
    const serverVideoState = useAppSelector(state => state.room.serverVideoState);

    useEffect(() => {
        if (!serverVideoState || !videoRef.current) return;

        const video = videoRef.current;

        const syncVideo = () => {
            const targetTime = getCurrentTime(serverVideoState);
            const currentTime = video.currentTime;
            const drift = Math.abs(currentTime - targetTime);

            // Sync if drift is more than 1 second
            if (drift > 1) {
                video.currentTime = targetTime;
            }

            // Sync play/pause state
            if (serverVideoState.isPlaying && video.paused) {
                video.play().catch(logger.error);
            } else if (!serverVideoState.isPlaying && !video.paused) {
                video.pause();
            }
        };

        // Initial sync
        syncVideo();

        // Periodic sync every second
        const interval = setInterval(syncVideo, 1000);

        return () => clearInterval(interval);
    }, [serverVideoState, videoRef]);
};
