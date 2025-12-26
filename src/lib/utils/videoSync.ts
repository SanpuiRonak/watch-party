import { VideoState } from "@/lib/types";

export const getCurrentTime = (videoState: VideoState): number => {
    if (!videoState.isPlaying) return videoState.currentTime;

    const elapsed = (Date.now() - videoState.lastUpdated) / 1000;
    return videoState.currentTime + elapsed * videoState.playbackRate;
};
