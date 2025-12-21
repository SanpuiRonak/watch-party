'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSetup } from '@/components/user/UserSetup';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useUser } from '@/hooks/useUser';
import { Users, Plus, Clock, User, Share, X } from 'lucide-react';

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
  const { user, isAuthenticated, createUser } = useUser();
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);

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

  const handleUserSetupComplete = (username: string) => {
    createUser(username);
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

  const shareRoom = async (roomId: string) => {
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(shareUrl);
    // Could add a toast notification here
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎉</span>
          <h1 className="text-4xl font-bold">Watch Party</h1>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <p className="text-sm text-muted-foreground">
              Welcome back, {user.username}!
            </p>
          )}
          <ThemeToggle />
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 pb-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleCreateRoom} size="lg" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Room
              </Button>
              
              <Button onClick={handleJoinRoom} variant="outline" size="lg" className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Room
              </Button>
            </div>
          </div>
        </div>

        {/* Room Sections */}
        {isAuthenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* My Rooms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Rooms Created by Me
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myRooms.length > 0 ? (
                  <div className="space-y-3">
                    {myRooms.slice(0, 5).map((room) => (
                      <div key={room.id} className="relative p-4 border rounded-lg hover:bg-muted/50 group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoom(room.id, true);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="cursor-pointer" onClick={() => router.push(`/room/${room.id}`)}>
                          <h4 className="font-medium truncate pr-8">{room.name}</h4>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <UserAvatar username={room.ownerName} size="sm" />
                            <span>{room.ownerName}</span>
                            <span>•</span>
                            <span>{formatDate(room.createdAt)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareRoom(room.id);
                          }}
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No rooms created yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Rooms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRooms.length > 0 ? (
                  <div className="space-y-3">
                    {recentRooms.slice(0, 5).map((room) => (
                      <div key={room.id} className="relative p-4 border rounded-lg hover:bg-muted/50 group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoom(room.id, false);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="cursor-pointer" onClick={() => router.push(`/room/${room.id}`)}>
                          <h4 className="font-medium truncate pr-8">{room.name}</h4>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <UserAvatar username={room.ownerName} size="sm" />
                            <span>{room.ownerName}</span>
                            <span>•</span>
                            <span>{formatDate(room.accessedAt || room.createdAt)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareRoom(room.id);
                          }}
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent rooms
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <UserSetup 
        open={showUserSetup} 
        onComplete={handleUserSetupComplete}
      />
    </main>
  );
}