'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSetup } from '@/components/user/UserSetup';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserAvatar } from '@/components/ui/user-avatar';
import { UserGuard } from '@/components/auth/UserGuard';
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
    <UserGuard>
      <main className="min-h-screen bg-background">
        {/* Header - Top 50% */}
        <div className="h-[50vh] flex flex-col justify-between px-6 py-6">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 -mx-6 px-6 py-4 -mt-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Watch Party</h1>
              <span className="text-3xl">🎉</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated && user && (
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.username}!
                </p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleCreateRoom} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Room
                </Button>
                
                <Button onClick={handleJoinRoom} variant="outline" size="sm" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Join Room
                </Button>
              </div>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <h2 className="text-2xl font-semibold text-muted-foreground mb-4">Watch videos together in sync with your friends!</h2>
            </div>
          </div>
          <div></div>
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
                    <h2 className="text-xl font-semibold">Rooms Created by Me</h2>
                  </div>
                  {myRooms.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {myRooms.map((room) => (
                        <div key={room.id} className="relative flex-shrink-0 min-w-80 max-w-96 p-4 border rounded-lg hover:bg-muted/50 group">
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute bottom-2 right-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareRoom(room.id);
                            }}
                          >
                            <Share className="h-3 w-3" />
                          </Button>
                          {copiedRoomId === room.id && (
                            <div className="absolute bottom-12 right-2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                              Link copied!
                            </div>
                          )}
                          <div className="flex flex-col h-full pr-12">
                            <h4 className="font-medium break-words cursor-pointer hover:underline" onClick={() => router.push(`/room/${room.id}`)}>{room.name}</h4>
                            <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-muted-foreground">
                              <UserAvatar username={room.ownerName} size="sm" />
                              <span className="truncate">{room.ownerName}</span>
                              <span className="flex-shrink-0">•</span>
                              <span 
                                className="cursor-pointer border-b border-dotted border-muted-foreground flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTimeFormat(room.id);
                                }}
                              >
                                {showAbsoluteTime[room.id] 
                                  ? `Created on ${formatDate(room.createdAt)}`
                                  : `Created ${getTimeAgo(room.createdAt)}`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 gap-3">
                      <User className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-base text-muted-foreground text-center">
                        Looks like you have not created any rooms yet. Please use <Button onClick={handleCreateRoom} size="sm" className="mx-1"><Plus className="h-4 w-4 mr-1" />Create Room</Button> to create a new room!
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Rooms */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Recent Rooms</h2>
                  </div>
                  {recentRooms.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {recentRooms.slice(0, 1000).map((room) => (
                      <div key={room.id} className="relative flex-shrink-0 min-w-80 max-w-96 p-4 border rounded-lg hover:bg-muted/50 group">
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute bottom-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareRoom(room.id);
                          }}
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                        {copiedRoomId === room.id && (
                          <div className="absolute bottom-12 right-2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                            Link copied!
                          </div>
                        )}
                        <div className="flex flex-col h-full pr-12">
                          <h4 className="font-medium break-words cursor-pointer hover:underline" onClick={() => router.push(`/room/${room.id}`)}>{room.name}</h4>
                          <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-muted-foreground">
                            <UserAvatar username={room.ownerName || 'Unknown'} size="sm" />
                            <span className="truncate">{room.ownerName || 'Unknown'}</span>
                            <span className="flex-shrink-0">•</span>
                            <span 
                              className="cursor-pointer border-b border-dotted border-muted-foreground flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTimeFormat(room.id);
                              }}
                            >
                              {showAbsoluteTime[room.id] 
                                ? `Accessed on ${formatDate(room.accessedAt || room.createdAt)}`
                                : `Accessed ${getTimeAgo(room.accessedAt || room.createdAt)}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <Clock className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-base text-muted-foreground text-center">
                      Looks like you haven't joined any rooms recently. Ask your friends for the room link to join their rooms!
                    </p>
                  </div>
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
    </UserGuard>
  );
}
