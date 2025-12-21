'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, SkipForward, Gauge } from 'lucide-react';
import { useAppSelector } from '@/lib/store';
import { RoomPermissions } from '@/lib/types';

interface RoomSettingsProps {
  onUpdatePermissions: (permissions: RoomPermissions) => void;
  isOwner: boolean;
}

export function RoomSettings({ onUpdatePermissions, isOwner }: RoomSettingsProps) {
  const room = useAppSelector(state => state.room.currentRoom);
  console.log('[RoomSettings] Component rendered, room permissions:', room?.permissions);
  
  const [canPlay, setCanPlay] = useState(room?.permissions.canPlay ?? true);
  const [canSeek, setCanSeek] = useState(room?.permissions.canSeek ?? true);
  const [canChangeSpeed, setCanChangeSpeed] = useState(room?.permissions.canChangeSpeed ?? true);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when room permissions change via socket
  useEffect(() => {
    if (room?.permissions && !hasChanges) {
      console.log('[RoomSettings] Room permissions changed, updating local state:', room.permissions);
      setCanPlay(room.permissions.canPlay);
      setCanSeek(room.permissions.canSeek);
      setCanChangeSpeed(room.permissions.canChangeSpeed ?? true);
    }
  }, [room?.permissions, hasChanges]);

  useEffect(() => {
    if (room?.permissions) {
      const roomCanChangeSpeed = room.permissions.canChangeSpeed ?? true;
      const hasChangesValue = (
        canPlay !== room.permissions.canPlay || 
        canSeek !== room.permissions.canSeek ||
        canChangeSpeed !== roomCanChangeSpeed
      );
      console.log('[RoomSettings] Checking for changes:', {
        current: { canPlay, canSeek, canChangeSpeed },
        room: { 
          canPlay: room.permissions.canPlay, 
          canSeek: room.permissions.canSeek, 
          canChangeSpeed: roomCanChangeSpeed 
        },
        hasChanges: hasChangesValue
      });
      setHasChanges(hasChangesValue);
    }
  }, [canPlay, canSeek, canChangeSpeed, room?.permissions]);

  const handleSave = () => {
    console.log('[RoomSettings] Saving permissions:', { canPlay, canSeek, canChangeSpeed });
    onUpdatePermissions({ canPlay, canSeek, canChangeSpeed });
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
              checked={room?.permissions.canPlay ?? true}
              disabled
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SkipForward className="h-4 w-4" />
              <span>Allow viewers to seek</span>
            </div>
            <Switch
              checked={room?.permissions.canSeek ?? true}
              disabled
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gauge className="h-4 w-4" />
              <span>Allow viewers to change speed</span>
            </div>
            <Switch
              checked={room?.permissions.canChangeSpeed ?? true}
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
            onCheckedChange={(checked) => {
              console.log('[RoomSettings] canPlay changed to:', checked);
              setCanPlay(checked);
            }}
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4" />
            <span>Allow viewers to change speed</span>
          </div>
          <Switch
            checked={canChangeSpeed}
            onCheckedChange={setCanChangeSpeed}
          />
        </div>
      </div>
      
      <div className="mt-auto pt-4">
        <Button 
          onClick={() => {
            console.log('[RoomSettings] Apply button clicked, hasChanges:', hasChanges);
            handleSave();
          }} 
          className="w-full" 
          disabled={!hasChanges}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}