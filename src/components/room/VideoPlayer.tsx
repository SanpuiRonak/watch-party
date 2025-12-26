'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/lib/store';
import { getCurrentTime } from '@/lib/utils/videoSync';
import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  streamUrl: string;
  onVideoEvent: (eventType: 'play' | 'pause' | 'seek', currentTime: number, playbackRate?: number) => void;
}

export function VideoPlayer({ streamUrl, onVideoEvent }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isUserAction, setIsUserAction] = useState(false);
  
  const serverVideoState = useAppSelector(state => state.room.serverVideoState);
  const room = useAppSelector(state => state.room.currentRoom);
  const user = useAppSelector(state => state.user.currentUser);
  const isConnected = useAppSelector(state => state.room.isConnected);
  const isOwner = user?.id === room?.ownerId;

  // Calculate canControl based on permissions (moved from parent)
  const canControl = isOwner || room?.permissions.canPlay || room?.permissions.canSeek || room?.permissions.canChangeSpeed;

  // Sync playback rate
  useEffect(() => {
    if (!videoRef.current || !serverVideoState) return;
    const rate = serverVideoState.playbackRate || 1;
    if (videoRef.current.playbackRate !== rate && isFinite(rate) && rate > 0) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, [serverVideoState?.playbackRate]);

  // Initial sync when video loads and server state is available
  useEffect(() => {
    if (!videoRef.current || !serverVideoState) return;

    const video = videoRef.current;
    const serverTime = getCurrentTime(serverVideoState);
    
    // Set initial position when video first loads
    if (video.readyState >= 2 && Math.abs(video.currentTime - serverTime) > 1) {
      video.currentTime = serverTime;
    }

    // Set initial play state
    if (serverVideoState.isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!serverVideoState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [serverVideoState?.lastUpdated]);

  // Sync with server video state during playback
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
    console.log('[VideoPlayer] handlePlay called, isOwner:', isOwner, 'canPlay:', room?.permissions.canPlay);
    if (!canControl || (!isOwner && !room?.permissions.canPlay) || !videoRef.current) {
      console.log('[VideoPlayer] handlePlay blocked - canControl:', canControl, 'isOwner:', isOwner, 'canPlay:', room?.permissions.canPlay, 'videoRef:', !!videoRef.current);
      return;
    }
    console.log('[VideoPlayer] handlePlay proceeding - calling onVideoEvent');
    setIsUserAction(true);
    onVideoEvent('play', videoRef.current.currentTime);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const handlePause = () => {
    console.log('[VideoPlayer] handlePause called, isOwner:', isOwner, 'canPlay:', room?.permissions.canPlay);
    if (!canControl || (!isOwner && !room?.permissions.canPlay) || !videoRef.current) {
      console.log('[VideoPlayer] handlePause blocked - canControl:', canControl, 'isOwner:', isOwner, 'canPlay:', room?.permissions.canPlay, 'videoRef:', !!videoRef.current);
      return;
    }
    console.log('[VideoPlayer] handlePause proceeding - calling onVideoEvent');
    setIsUserAction(true);
    onVideoEvent('pause', videoRef.current.currentTime);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const handleSeek = (time: number) => {
    if (!canControl || (!isOwner && !room?.permissions.canSeek) || !videoRef.current) return;
    setIsUserAction(true);
    videoRef.current.currentTime = time;
    onVideoEvent('seek', time);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const handleSeeked = () => {
    if (!canControl || (!isOwner && !room?.permissions.canSeek) || !videoRef.current || isUserAction) return;
    // Only emit seek event if it was a manual user action (not from sync)
    setIsUserAction(true);
    onVideoEvent('seek', videoRef.current.currentTime);
    setTimeout(() => setIsUserAction(false), 100);
  };

  const togglePlayPause = () => {
    console.log('[VideoPlayer] togglePlayPause called, canPlay:', room?.permissions.canPlay, 'isOwner:', isOwner);
    if (!videoRef.current || (!isOwner && !room?.permissions.canPlay)) {
      console.log('[VideoPlayer] togglePlayPause blocked - no permission or no video ref');
      return;
    }
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

  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current || (!isOwner && !room?.permissions.canChangeSpeed)) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    onVideoEvent('seek', videoRef.current.currentTime, rate);
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group border border-black dark:border-white">
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
          <div title={!isOwner && !room?.permissions.canSeek ? "Seeking disabled by owner" : ""}>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(value) => (isOwner || room?.permissions.canSeek) && handleSeek(value[0])}
              className="w-full"
              disabled={!isOwner && !room?.permissions.canSeek}
            />
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              disabled={!isOwner && !room?.permissions.canPlay}
              className="text-white hover:bg-white/20"
              title={!isOwner && !room?.permissions.canPlay ? "Play/Pause disabled by owner" : ""}
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
            {/* Playback Speed */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (isOwner || room?.permissions.canChangeSpeed) && setShowSpeedMenu(!showSpeedMenu)}
                disabled={!isOwner && !room?.permissions.canChangeSpeed}
                className="text-white hover:bg-white/20 text-xs px-2"
                title={!isOwner && !room?.permissions.canChangeSpeed ? "Playback speed control disabled by owner" : ""}
              >
                {playbackRate}x
              </Button>
              {showSpeedMenu && room?.permissions.canChangeSpeed && (
                <div className="absolute bottom-full mb-2 right-0 bg-black/90 rounded-md p-2 min-w-16">
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handlePlaybackRateChange(speed)}
                      className={`block w-full text-left px-2 py-1 text-xs rounded hover:bg-white/20 ${
                        playbackRate === speed ? 'text-blue-400' : 'text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            
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
