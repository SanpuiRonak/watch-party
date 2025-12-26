'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/room/VideoPlayer';
import { RoomSettings } from '@/components/room/RoomSettings';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { Header } from '@/components/header/Header';
import { HeaderLogo } from '@/components/header/HeaderLogo';
import { RoomInfo } from '@/components/header/RoomInfo';
import { ConnectionStatus } from '@/components/header/ConnectionStatus';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { useSocket } from '@/hooks/useSocket';
import { useUser } from '@/hooks/useUser';
import { useAppSelector, useAppDispatch } from '@/lib/store';
import { setRoom } from '@/lib/store/slices/roomSlice';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Share, Settings, Users } from 'lucide-react';
import { RoomPermissions } from '@/lib/types';
import { APP_CONFIG, MESSAGES, UI_TEXT } from '@/lib/constants';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useUser();
  const [roomId, setRoomId] = useState<string>('');

  const room = useAppSelector(state => state.room.currentRoom);
  const isConnected = useAppSelector(state => state.room.isConnected);

  // Update document title
  useEffect(() => {
    if (room) {
      document.title = room.name;
    }
  }, [room]);

  const shareRoom = async () => {
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success(MESSAGES.copiedToClipboard);
  };

  useEffect(() => {
    params.then(({ roomId }) => setRoomId(roomId));
  }, [params]);

  const { emitVideoEvent, emitPermissionsUpdate } = useSocket(roomId, user?.id || '', user?.username || '');

  const handleVideoEvent = (eventType: 'play' | 'pause' | 'seek', currentTime: number, playbackRate?: number) => {
    emitVideoEvent(eventType, currentTime, playbackRate);
  };



  useEffect(() => {
    if (roomId && !room) {
      // Load room data
      fetch(`/api/room/${roomId}`)
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
  }, [roomId, room, router, dispatch, user]);

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    toast.success(MESSAGES.copiedToClipboard);
  };

  const handleUpdatePermissions = async (permissions: RoomPermissions) => {
    if (!user || !room) return;

    console.log('[RoomPage] Updating permissions:', permissions);
    // Emit via socket for real-time updates
    emitPermissionsUpdate(permissions);
  };

  if (!room || !user) {
    return (
      <AuthWrapper requireAuth={true} redirectTo="/user" loadingMessage="Loading room...">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{MESSAGES.loadingRoom}</p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  const isOwner = user.id === room.ownerId;
  const canPlay = room.permissions.canPlay;
  const canSeek = room.permissions.canSeek;
  const canChangeSpeed = room.permissions.canChangeSpeed;

  return (
    <AuthWrapper requireAuth={true} redirectTo="/user" loadingMessage="Loading room...">
      <div className="min-h-screen bg-background">
        {/* Full Width Header */}
        <Header
          leftAlignedComponents={[<HeaderLogo key="header-logo" />, <RoomInfo key="room-info" />]}
          rightAlignedComponents={[<ConnectionStatus key="connection-status" />, <ThemeToggle key="theme-toggle" />]}
        />

        {/* Main Content */}
        <div className="flex" style={{height: 'calc(100vh - 120px)'}}>
          <div className="flex-1 p-2">
            {/* Video Player */}
            <div>
              <VideoPlayer
                streamUrl={room.streamUrl}
                onVideoEvent={handleVideoEvent}
              />

              {/* Mobile Tabs - Only show on mobile */}
              <div className="mt-2 lg:hidden">
                <Tabs defaultValue="participants" className="w-full">
                  <TabsList className="flex w-full gap-0">
                    <TabsTrigger value="participants" className="flex items-center gap-2 px-4 py-2">
                      <Users className="h-5 w-5 flex-shrink-0" />
                      {UI_TEXT.participants} ({room.participants.length})
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2 px-4 py-2">
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      {UI_TEXT.roomSettings}
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
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Desktop Only */}
          <div className="hidden lg:block w-80 bg-neutral-50 dark:bg-neutral-800 h-full">
            <div className="h-full p-4">
              <Tabs defaultValue="participants" className="w-full h-full flex flex-col">
                <TabsList className="flex w-full gap-0">
                  <TabsTrigger value="participants" className="flex items-center gap-2 px-4 py-2">
                    <Users className="h-5 w-5 flex-shrink-0" />
                    {UI_TEXT.participants} ({room.participants.length})
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2 px-4 py-2">
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    {UI_TEXT.settings}
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
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
