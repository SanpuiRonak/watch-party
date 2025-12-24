'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import { generateUsername } from '@/lib/utils/userStorage';
import { sanitizeUsername } from '@/lib/utils/security';
import { RefreshCw } from 'lucide-react';

interface UserSetupProps {
  open: boolean;
  onComplete: (username: string) => void;
}

export function UserSetup({ open, onComplete }: UserSetupProps) {
  const router = useRouter();
  const [username, setUsername] = useState(generateUsername());

  const handleRegenerateUsername = () => {
    setUsername(generateUsername());
  };

  const handleConfirm = () => {
    try {
      // Sanitize username to prevent XSS attacks
      const sanitizedUsername = sanitizeUsername(username);
      onComplete(sanitizedUsername);
      router.push('/');
    } catch (error) {
      // If sanitization fails, generate a new safe username
      console.error('Invalid username:', error);
      const newUsername = generateUsername();
      setUsername(newUsername);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex w-full space-x-2 items-center">
            <div className="flex-shrink-0">
              <UserAvatar username={username} size="lg" />
            </div>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 50))}
              placeholder="Username"
              maxLength={50}
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
