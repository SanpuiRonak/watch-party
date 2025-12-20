import { VideoState } from '@/lib/types';

export const getCurrentTime = (videoState: VideoState): number => {
  if (!videoState.isPlaying) return videoState.lastEventTime;
  
  const elapsed = (Date.now() - videoState.lastEventTimestamp) / 1000;
  return videoState.lastEventTime + (elapsed * videoState.playbackRate);
};

export const createVideoEvent = (
  eventType: 'play' | 'pause' | 'seek',
  currentTime: number
): VideoState => ({
  lastEventTime: currentTime,
  lastEventTimestamp: Date.now(),
  isPlaying: eventType === 'play',
  playbackRate: 1
});