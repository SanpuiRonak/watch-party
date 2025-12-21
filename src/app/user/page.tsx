'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { generateUsername } from '@/lib/utils/userStorage';
import { useUser } from '@/hooks/useUser';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RefreshCw } from 'lucide-react';

export default function UserPage() {
  const router = useRouter();
  const { createUser } = useUser();
  const [username, setUsername] = useState('');

  // Initialize username on client side to prevent hydration mismatch
  useEffect(() => {
    setUsername(generateUsername());
  }, []);

  const handleRegenerateUsername = () => {
    setUsername(generateUsername());
  };

  const handleComplete = () => {
    const trimmedUsername = username.trim().slice(0, 50);
    createUser(trimmedUsername);
    
    // Redirect to original page or home
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/';
    router.replace(returnUrl);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      {/* Top 1/3 - Title */}
      <div className="flex-1 flex items-end justify-center pb-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to <span className="text-4xl">🎉</span> Watch Party!</h1>
          <p className="text-lg text-muted-foreground">Please create a user to get started</p>
        </div>
      </div>
      
      {/* Center - Fields */}
      <div className="flex items-start justify-center pt-8">
        <div className="w-full max-w-md space-y-6">
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
          
          <Button onClick={handleComplete} className="w-full">
            Continue
          </Button>
        </div>
      </div>
      
      {/* Bottom 1/3 - Empty */}
      <div className="flex-1"></div>
    </div>
  );
}