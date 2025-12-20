'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/room/VideoPlayer';
import { RoomControls } from '@/components/room/RoomControls';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { UserSetup } from '@/components/user/UserSetup';
import { useSocket } from '@/hooks/useSocket';
import { useUser } from '@/hooks/useUser';
import { useAppSelector } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check } from 'lucide-react';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, createUser } = useUser();
  const [roomId, setRoomId] = useState<string>('');
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const room = useAppSelector(state => state.room.currentRoom);
  const isConnected = useAppSelector(state => state.room.isConnected);

  useEffect(() => {
    params.then(({ roomId }) => setRoomId(roomId));
  }, [params]);

  const { emitVideoEvent } = useSocket(roomId, user?.id || '');

  useEffect(() => {
    if (roomId && !isAuthenticated) {
      setShowUserSetup(true);
    }
  }, [roomId, isAuthenticated]);

  useEffect(() => {
    if (roomId && isAuthenticated && !room) {
      // Check if room exists
      fetch(`/api/rooms/${roomId}`)
        .then(res => {
          if (!res.ok) {
            router.push('/404');
          }
        })
        .catch(() => router.push('/404'));
    }
  }, [roomId, isAuthenticated, room, router]);

  const handleUserSetupComplete = (username: string, avatar: string) => {
    createUser(username, avatar);
    setShowUserSetup(false);
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <UserSetup 
        open={showUserSetup} 
        onComplete={handleUserSetupComplete}
      />
    );
  }

  if (!room || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  const isOwner = user.id === room.ownerId;
  const canPlay = room.permissions.canPlay;
  const canSeek = room.permissions.canSeek;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Watch Party</h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Room: {roomId}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyRoomId}
                  className="h-6 px-2"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3 space-y-4">
            <VideoPlayer
              streamUrl={room.streamUrl}
              onVideoEvent={emitVideoEvent}
              canControl={canPlay || canSeek}
            />
            
            <RoomControls
              onVideoEvent={emitVideoEvent}
              canPlay={canPlay}
              canSeek={canSeek}
              isOwner={isOwner}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ParticipantsList />
          </div>
        </div>
      </div>
    </div>
  );
}