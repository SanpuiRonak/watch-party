'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSetup } from '@/components/user/UserSetup';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Header } from '@/components/layout/Header';
import { HeaderLogo } from '@/components/layout/HeaderLogo';
import { WelcomeMessage } from '@/components/layout/WelcomeMessage';
import { CreateRoomButton } from '@/components/layout/CreateRoomButton';
import { JoinRoomButton } from '@/components/layout/JoinRoomButton';
import { RoomCard } from '@/components/room/RoomCard';
import { EmptyCardSection } from '@/components/ui/EmptyCardSection';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useUser } from '@/hooks/useUser';
import { Users, Plus, Clock, User, Share, X } from 'lucide-react';
import { APP_CONFIG, MESSAGES, UI_TEXT } from '@/lib/constants';

interface Room {
  id: string;
  name: string;
  streamUrl: string;
  createdAt: number;
  accessedAt?: number;
  ownerId: string;
  ownerName: string;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [showAbsoluteTime, setShowAbsoluteTime] = useState<{[key: string]: boolean}>({});

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

  const handleUserSetupComplete = (user: { id: string; username: string }) => {
    // User is already set via Redux in UserSetup component
    // Cookie is set by API
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

  // Load user's rooms from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedMyRooms = localStorage.getItem(`myRooms_${user.id}`);
      const storedRecentRooms = localStorage.getItem(`recentRooms_${user.id}`);
      
      if (storedMyRooms) {
        setMyRooms(JSON.parse(storedMyRooms));
      }
      
      if (storedRecentRooms) {
        setRecentRooms(JSON.parse(storedRecentRooms));
      }
    }
  }, [isAuthenticated, user]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTimeAgo = (timestamp: number) => {
    const now = 1700000000000; // Fixed timestamp for SSR consistency
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const toggleTimeFormat = (roomId: string) => {
    setShowAbsoluteTime(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const shareRoom = async (roomId: string) => {
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const deleteRoom = (roomId: string, isMyRoom: boolean) => {
    if (isMyRoom) {
      const updatedRooms = myRooms.filter(room => room.id !== roomId);
      setMyRooms(updatedRooms);
      localStorage.setItem(`myRooms_${user?.id}`, JSON.stringify(updatedRooms));
    } else {
      const updatedRooms = recentRooms.filter(room => room.id !== roomId);
      setRecentRooms(updatedRooms);
      localStorage.setItem(`recentRooms_${user?.id}`, JSON.stringify(updatedRooms));
    }
  };

  return (
    <AuthWrapper requireAuth={true} redirectTo="/user" loadingMessage="Loading Watch Party...">
      <main className="min-h-screen bg-background">
        {/* Header - Top 50% */}
        <div className="h-[50vh] flex flex-col px-6 py-6">
          <div className="-mx-6 -mt-6 mb-6">
            <Header
              leftAlignedComponents={[<HeaderLogo key="header-logo" />]}
              rightAlignedComponents={[
                <WelcomeMessage key="welcome-message" />,
                <CreateRoomButton key="create-room" />,
                <JoinRoomButton key="join-room" />,
                <ThemeToggle key="theme-toggle" />
              ]}
            />
          </div>
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <h2 className="text-2xl font-semibold text-muted-foreground mb-4">{APP_CONFIG.description}</h2>
            </div>
          </div>
        </div>
        
        {/* Room Sections - Aligned to bottom */}
        <div className="h-[50vh] flex flex-col justify-center px-6">
          <div className="flex flex-col justify-evenly h-full py-6">
            {isAuthenticated && (
              <>
                {/* My Rooms */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">{UI_TEXT.roomsCreatedByMe}</h2>
                  </div>
                  {myRooms.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {myRooms.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          type="my-room"
                          onDelete={(roomId) => deleteRoom(roomId, true)}
                          onShare={shareRoom}
                          showAbsoluteTime={showAbsoluteTime}
                          onToggleTimeFormat={toggleTimeFormat}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyCardSection
                      icon={User}
                      title=""
                      description={MESSAGES.noRoomsCreated}
                    />
                  )}
                </div>

                {/* Recent Rooms */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">{UI_TEXT.recentRooms}</h2>
                  </div>
                  {recentRooms.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {recentRooms.slice(0, 1000).map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          type="recent-room"
                          onDelete={(roomId) => deleteRoom(roomId, false)}
                          onShare={shareRoom}
                          showAbsoluteTime={showAbsoluteTime}
                          onToggleTimeFormat={toggleTimeFormat}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyCardSection
                      icon={Clock}
                      title=""
                      description={MESSAGES.noRecentRooms}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      
        <UserSetup
          open={showUserSetup}
          onComplete={handleUserSetupComplete}
        />
      </main>
    </AuthWrapper>
  );
}
