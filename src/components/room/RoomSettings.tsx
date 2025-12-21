'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, SkipForward } from 'lucide-react';
import { useAppSelector } from '@/lib/store';
import { RoomPermissions } from '@/lib/types';

interface RoomSettingsProps {
  onUpdatePermissions: (permissions: RoomPermissions) => void;
  isOwner: boolean;
}

export function RoomSettings({ onUpdatePermissions, isOwner }: RoomSettingsProps) {
  const room = useAppSelector(state => state.room.currentRoom);
  const [canPlay, setCanPlay] = useState(room?.permissions.canPlay ?? true);
  const [canSeek, setCanSeek] = useState(room?.permissions.canSeek ?? true);
  const [hasChanges, setHasChanges] = useState(false);

  const originalCanPlay = room?.permissions.canPlay ?? true;
  const originalCanSeek = room?.permissions.canSeek ?? true;

  // Update local state when room permissions change via socket
  useEffect(() => {
    setCanPlay(room?.permissions.canPlay ?? true);
    setCanSeek(room?.permissions.canSeek ?? true);
  }, [room?.permissions]);

  useEffect(() => {
    setHasChanges(canPlay !== originalCanPlay || canSeek !== originalCanSeek);
  }, [canPlay, canSeek, originalCanPlay, originalCanSeek]);

  const handleSave = () => {
    onUpdatePermissions({ canPlay, canSeek });
    setHasChanges(false);
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Allow viewers to play/pause</span>
            </div>
            <Switch
              checked={originalCanPlay}
              disabled
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SkipForward className="h-4 w-4" />
              <span>Allow viewers to seek</span>
            </div>
            <Switch
              checked={originalCanSeek}
              disabled
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>Allow viewers to play/pause</span>
          </div>
          <Switch
            checked={canPlay}
            onCheckedChange={setCanPlay}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SkipForward className="h-4 w-4" />
            <span>Allow viewers to seek</span>
          </div>
          <Switch
            checked={canSeek}
            onCheckedChange={setCanSeek}
          />
        </div>
      </div>
      
      <div className="mt-auto pt-4">
        <Button 
          onClick={handleSave} 
          className="w-full" 
          disabled={!hasChanges}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}