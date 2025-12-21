'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/lib/store';
import { getCurrentTime } from '@/lib/utils/videoSync';
import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  streamUrl: string;
  onVideoEvent: (eventType: 'play' | 'pause' | 'seek', currentTime: number) => void;
  canControl: boolean;
}

export function VideoPlayer({ streamUrl, onVideoEvent, canControl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isUserAction, setIsUserAction] = useState(false);
  
  const serverVideoState = useAppSelector(state => state.room.serverVideoState);
  const room = useAppSelector(state => state.room.currentRoom);
  const isConnected = useAppSelector(state => state.room.isConnected);

  // Sync with server video state
  useEffect(() => {
    if (!videoRef.current || !serverVideoState || isUserAction) return;

    const video = videoRef.current;
    const serverTime = getCurrentTime(serverVideoState);
    const timeDiff = Math.abs(video.currentTime - serverTime);

    if (timeDiff > 1) {
      video.currentTime = serverTime;
    }

    if (serverVideoState.isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!serverVideoState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [serverVideoState, isUserAction]);

  const handlePlay = () => {
    if (!canControl || !room?.permissions.canPlay || !videoRef.current) return;
    setIsUserAction(true);
    onVideoEvent('play', videoRef.current.currentTime);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const handlePause = () => {
    if (!canControl || !room?.permissions.canPlay || !videoRef.current) return;
    setIsUserAction(true);
    onVideoEvent('pause', videoRef.current.currentTime);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const handleSeek = (time: number) => {
    if (!canControl || !room?.permissions.canSeek || !videoRef.current) return;
    setIsUserAction(true);
    videoRef.current.currentTime = time;
    onVideoEvent('seek', time);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const handleSeeked = () => {
    if (!canControl || !room?.permissions.canSeek || !videoRef.current || isUserAction) return;
    // Only emit seek event if it was a manual user action (not from sync)
    setIsUserAction(true);
    onVideoEvent('seek', videoRef.current.currentTime);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      handlePlay();
    } else {
      handlePause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onSeeked={handleSeeked}
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={(value) => room?.permissions.canSeek && handleSeek(value[0])}
            className="w-full"
            disabled={!room?.permissions.canSeek}
          />
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              disabled={!room?.permissions.canPlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
            
            {/* Time */}
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Picture in Picture */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePiP}
              className="text-white hover:bg-white/20"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </Button>
            
            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
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