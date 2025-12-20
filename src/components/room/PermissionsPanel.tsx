'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Play, SkipForward } from 'lucide-react';
import { useAppSelector } from '@/lib/store';

interface PermissionsPanelProps {
  onUpdatePermissions: (permissions: { canPlay: boolean; canSeek: boolean }) => void;
}

export function PermissionsPanel({ onUpdatePermissions }: PermissionsPanelProps) {
  const room = useAppSelector(state => state.room.currentRoom);
  const [canPlay, setCanPlay] = useState(room?.permissions.canPlay ?? true);
  const [canSeek, setCanSeek] = useState(room?.permissions.canSeek ?? true);

  const handleSave = () => {
    onUpdatePermissions({ canPlay, canSeek });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Room Settings
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Room Permissions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Allow viewers to play/pause</span>
            </div>
            <Button
              variant={canPlay ? "default" : "outline"}
              size="sm"
              onClick={() => setCanPlay(!canPlay)}
            >
              {canPlay ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SkipForward className="h-4 w-4" />
              <span>Allow viewers to seek</span>
            </div>
            <Button
              variant={canSeek ? "default" : "outline"}
              size="sm"
              onClick={() => setCanSeek(!canSeek)}
            >
              {canSeek ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}