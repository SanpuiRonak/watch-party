'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import { generateUsername } from '@/lib/utils/userStorage';
import { RefreshCw } from 'lucide-react';

interface UserSetupProps {
  open: boolean;
  onComplete: (username: string) => void;
}

export function UserSetup({ open, onComplete }: UserSetupProps) {
  const [username, setUsername] = useState(generateUsername());

  const handleRegenerateUsername = () => {
    setUsername(generateUsername());
  };

  const handleConfirm = () => {
    onComplete(username);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <UserAvatar username={username} size="lg" />
          
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