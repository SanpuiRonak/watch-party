'use client';

import { useRef, useEffect } from 'react';
import { useVideoSync } from '@/hooks/useVideoSync';
import { useAppSelector } from '@/lib/store';

interface VideoPlayerProps {
  streamUrl: string;
  onVideoEvent: (eventType: 'play' | 'pause' | 'seek', currentTime: number) => void;
  canControl: boolean;
}

export function VideoPlayer({ streamUrl, onVideoEvent, canControl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isConnected = useAppSelector(state => state.room.isConnected);
  
  useVideoSync(videoRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (canControl) {
        onVideoEvent('play', video.currentTime);
      }
    };

    const handlePause = () => {
      if (canControl) {
        onVideoEvent('pause', video.currentTime);
      }
    };

    const handleSeeked = () => {
      if (canControl) {
        onVideoEvent('seek', video.currentTime);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [canControl, onVideoEvent]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full"
        controls={canControl}
        preload="metadata"
      />
      
      {!isConnected && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Connecting...</p>
          </div>
        </div>
      )}
    </div>
  );
}