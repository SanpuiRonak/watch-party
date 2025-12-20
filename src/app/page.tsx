'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserSetup } from '@/components/user/UserSetup';
import { useUser } from '@/hooks/useUser';
import { Users, Plus } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, createUser } = useUser();
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null);

  const handleCreateRoom = () => {
    if (!isAuthenticated) {
      setPendingAction('create');
      setShowUserSetup(true);
    } else {
      router.push('/create-room');
    }
  };

  const handleJoinRoom = () => {
    if (!isAuthenticated) {
      setPendingAction('join');
      setShowUserSetup(true);
    } else {
      const roomId = prompt('Enter Room ID:');
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    }
  };

  const handleUserSetupComplete = (username: string, avatar: string) => {
    createUser(username, avatar);
    setShowUserSetup(false);
    
    if (pendingAction === 'create') {
      router.push('/create-room');
    } else if (pendingAction === 'join') {
      const roomId = prompt('Enter Room ID:');
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    }
    setPendingAction(null);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Watch Party</h1>
          <p className="text-muted-foreground">Synchronized video watching experience</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleCreateRoom} size="lg" className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Room
          </Button>
          
          <Button onClick={handleJoinRoom} variant="outline" size="lg" className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Room
          </Button>
        </div>
        
        {isAuthenticated && user && (
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.username}!
          </p>
        )}
      </div>
      
      <UserSetup 
        open={showUserSetup} 
        onComplete={handleUserSetupComplete}
      />
    </main>
  );
}