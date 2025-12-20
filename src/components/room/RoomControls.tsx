'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useAppSelector } from '@/lib/store';
import { getCurrentTime } from '@/lib/utils/videoSync';
import { PermissionsPanel } from './PermissionsPanel';
import { RoomPermissions } from '@/lib/types';

interface RoomControlsProps {
  onVideoEvent: (eventType: 'play' | 'pause' | 'seek', currentTime: number) => void;
  onUpdatePermissions: (permissions: RoomPermissions) => void;
  canPlay: boolean;
  canSeek: boolean;
  isOwner: boolean;
}

export function RoomControls({ onVideoEvent, onUpdatePermissions, canPlay, canSeek, isOwner }: RoomControlsProps) {
  const serverVideoState = useAppSelector(state => state.room.serverVideoState);
  const currentTime = serverVideoState ? getCurrentTime(serverVideoState) : 0;
  const isPlaying = serverVideoState?.isPlaying || false;

  const handlePlayPause = () => {
    if (!canPlay) return;
    onVideoEvent(isPlaying ? 'pause' : 'play', currentTime);
  };

  const handleSeek = (seconds: number) => {
    if (!canSeek) return;
    const newTime = Math.max(0, currentTime + seconds);
    onVideoEvent('seek', newTime);
  };

  const handleUpdatePermissions = (permissions: RoomPermissions) => {
    onUpdatePermissions(permissions);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg">
      <div className="flex items-center space-x-2">
        {canSeek && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleSeek(-10)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
        )}
        
        {canPlay && (
          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {canSeek && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleSeek(10)}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">
          {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
        </span>
        
        {isOwner && (
          <PermissionsPanel onUpdatePermissions={handleUpdatePermissions} />
        )}
      </div>
    </div>
  );
}