'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { generateUsername, generateAvatar } from '@/lib/utils/userStorage';
import { RefreshCw } from 'lucide-react';

interface UserSetupProps {
  open: boolean;
  onComplete: (username: string, avatar: string) => void;
}

export function UserSetup({ open, onComplete }: UserSetupProps) {
  const [username, setUsername] = useState(generateUsername());
  const [avatar, setAvatar] = useState(generateAvatar());

  const handleRegenerateUsername = () => {
    setUsername(generateUsername());
  };

  const handleRegenerateAvatar = () => {
    setAvatar(generateAvatar());
  };

  const handleConfirm = () => {
    onComplete(username, avatar);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Avatar className="h-16 w-16">
              <AvatarFallback className={`${avatar} text-white font-bold text-xl`}>
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="icon" onClick={handleRegenerateAvatar}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex w-full space-x-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <Button variant="outline" size="icon" onClick={handleRegenerateUsername}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleConfirm} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}