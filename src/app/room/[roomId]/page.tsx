'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/room/ModernVideoPlayer';
import { RoomControls } from '@/components/room/RoomControls';
import { RoomSettings } from '@/components/room/RoomSettings';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { UserSetup } from '@/components/user/UserSetup';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserGuard } from '@/components/auth/UserGuard';
import { useSocket } from '@/hooks/useSocket';
import { useUser } from '@/hooks/useUser';
import { useAppSelector, useAppDispatch } from '@/lib/store';
import { setRoom } from '@/lib/store/slices/roomSlice';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Share, Settings, Users } from 'lucide-react';
import { RoomPermissions } from '@/lib/types';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, createUser } = useUser();
  const [roomId, setRoomId] = useState<string>('');
  const [showUserSetup, setShowUserSetup] = useState(false);
  
  const room = useAppSelector(state => state.room.currentRoom);
  const isConnected = useAppSelector(state => state.room.isConnected);

  // Update document title
  useEffect(() => {
    if (room) {
      document.title = `Watch Party | ${room.name}`;
    }
  }, [room]);

  const shareRoom = async () => {
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Room link copied to clipboard!');
  };

  useEffect(() => {
    params.then(({ roomId }) => setRoomId(roomId));
  }, [params]);

  const { emitVideoEvent, emitPermissionsUpdate } = useSocket(roomId, user?.id || '', user?.username || '');

  useEffect(() => {
    if (roomId && !isAuthenticated) {
      setShowUserSetup(true);
    }
  }, [roomId, isAuthenticated]);

  useEffect(() => {
    if (roomId && isAuthenticated && !room) {
      // Load room data
      fetch(`/api/rooms/${roomId}`)
        .then(res => {
          if (!res.ok) {
            router.push('/404');
            return;
          }
          return res.json();
        })
        .then(roomData => {
          if (roomData && user) {
            // Set room data in Redux while socket connects
            dispatch(setRoom(roomData));
            
            // Save to recent rooms if not owned by user
            if (roomData.ownerId !== user.id) {
              const recentRoom = {
                id: roomData.id,
                name: roomData.name,
                streamUrl: roomData.streamUrl,
                createdAt: roomData.createdAt,
                accessedAt: Date.now(),
                ownerId: roomData.ownerId,
                ownerName: roomData.ownerName || 'Unknown'
              };
              
              const existingRecent = JSON.parse(localStorage.getItem(`recentRooms_${user.id}`) || '[]');
              const updatedRecent = [recentRoom, ...existingRecent.filter((r: any) => r.id !== roomData.id)];
              localStorage.setItem(`recentRooms_${user.id}`, JSON.stringify(updatedRecent.slice(0, 1000)));
            }
          }
        })
        .catch(() => router.push('/404'));
    }
  }, [roomId, isAuthenticated, room, router, dispatch, user]);

  const handleUserSetupComplete = (username: string) => {
    createUser(username);
    setShowUserSetup(false);
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!');
  };

  useEffect(() => {
    if (roomId && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/user?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [roomId, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
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

  const handleUpdatePermissions = async (permissions: RoomPermissions) => {
    if (!user || !room) return;
    
    console.log('[RoomPage] Updating permissions:', permissions);
    // Emit via socket for real-time updates
    emitPermissionsUpdate(permissions);
  };

  const isOwner = user.id === room.ownerId;
  const canPlay = room.permissions.canPlay;
  const canSeek = room.permissions.canSeek;
  const canChangeSpeed = room.permissions.canChangeSpeed;

  return (
    <UserGuard>
      <div className="min-h-screen bg-background">
        {/* Full Width Header */}
        <div className="w-screen bg-gray-100 dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-gray-100/95 dark:supports-[backdrop-filter]:bg-gray-900/95">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                  <span className="text-3xl">🎉</span>
                  <h1 className="text-2xl font-bold">Watch Party</h1>
                </div>
                <div 
                  className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:bg-accent/50 transition-colors rounded-lg p-2 -m-2" 
                  onClick={shareRoom}
                >
                  <span className="text-lg font-medium">{room.name}</span>
                  <Share className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-muted-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex" style={{height: 'calc(100vh - 120px)'}}>
          <div className="flex-1 p-2">
            {/* Video Player */}
            <div>
              <VideoPlayer
                streamUrl={room.streamUrl}
                onVideoEvent={emitVideoEvent}
                canControl={isOwner || canPlay || canSeek || canChangeSpeed}
              />
              
              {/* Mobile Tabs - Only show on mobile */}
              <div className="mt-2 lg:hidden">
                <Tabs defaultValue="participants" className="w-full">
                  <TabsList className="flex w-full gap-0">
                    <TabsTrigger value="participants" className="flex items-center gap-2 px-4 py-2">
                      <Users className="h-5 w-5 flex-shrink-0" />
                      Participants ({room.participants.length})
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2 px-4 py-2">
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      Room Settings
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="participants" className="mt-4">
                    <ParticipantsList />
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-4">
                    <div className={!isOwner ? 'pointer-events-none opacity-50' : ''}>
                      <RoomSettings
                        onUpdatePermissions={handleUpdatePermissions}
                        isOwner={isOwner}
                      />
                    </div>
                    {!isOwner && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg" title="Controls can only be updated by the room owner">
                        <span className="sr-only">Controls can only be updated by the room owner</span>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Desktop Only */}
          <div className="hidden lg:block w-80 bg-gray-50 dark:bg-gray-800">
            <div className="h-full p-4">
              <Tabs defaultValue="participants" className="w-full h-full flex flex-col">
                <TabsList className="flex w-full gap-0">
                  <TabsTrigger value="participants" className="flex items-center gap-2 px-4 py-2">
                    <Users className="h-5 w-5 flex-shrink-0" />
                    Participants ({room.participants.length})
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2 px-4 py-2">
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="participants" className="mt-4 flex-1 overflow-hidden">
                  <ParticipantsList />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-4 flex-1 overflow-hidden">
                  <div className={!isOwner ? 'pointer-events-none opacity-50' : ''}>
                    <RoomSettings
                      onUpdatePermissions={handleUpdatePermissions}
                      isOwner={isOwner}
                    />
                  </div>
                  {!isOwner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg" title="Controls can only be updated by the room owner">
                      <span className="sr-only">Controls can only be updated by the room owner</span>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </UserGuard>
  );
}