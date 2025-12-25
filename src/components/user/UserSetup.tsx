'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import { generateUsername } from '@/lib/utils/userStorage';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UserSetupProps {
  open: boolean;
  onComplete: (user: { id: string; username: string }) => void;
}

export function UserSetup({ open, onComplete }: UserSetupProps) {
  const router = useRouter();
  const [username, setUsername] = useState(generateUsername());
  const [isLoading, setIsLoading] = useState(false);

  const handleRegenerateUsername = () => {
    setUsername(generateUsername());
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Call API to create user and set secure cookie
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
        credentials: 'include', // Important: Include cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const { user } = await response.json();
      
      // Cookie is automatically set by browser (httpOnly)
      // Pass user data to parent component
      onComplete(user);
      toast.success('Welcome to Watch Party! 🎉');
      router.push('/');
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user. Please try again.');
      setIsLoading(false);
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
