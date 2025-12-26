'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserGuard } from '@/components/auth/UserGuard';
import { useUser } from '@/hooks/useUser';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { APP_CONFIG, MESSAGES, UI_TEXT } from '@/lib/constants';

export default function CreateRoom() {
  const router = useRouter();
  const { user } = useUser();
  const [roomName, setRoomName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Set default room name when user is available
  useEffect(() => {
    if (user && !roomName) {
      setRoomName(`${user.username}'s ${APP_CONFIG.name}`);
    }
  }, [user, roomName]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreateRoom();
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError(MESSAGES.roomNameRequired);
      return;
    }
    if (roomName.length > 50) {
      setError(MESSAGES.roomNameTooLong);
      return;
    }
    if (!streamUrl.trim()) {
      setError(MESSAGES.streamUrlRequired);
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          streamUrl: streamUrl,
          ownerId: user?.id,
          ownerName: user?.username,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Save to user's created rooms
        if (user) {
          const roomData = {
            id: data.roomId,
            name: roomName.trim(),
            streamUrl,
            createdAt: Date.now(),
            ownerId: user.id,
            ownerName: user.username
          };

          const existingRooms = JSON.parse(localStorage.getItem(`myRooms_${user.id}`) || '[]');
          const updatedRooms = [roomData, ...existingRooms.filter((r: any) => r.id !== data.roomId)];
          localStorage.setItem(`myRooms_${user.id}`, JSON.stringify(updatedRooms.slice(0, 10)));
        }

        router.push(`/room/${data.roomId}`);
      } else {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        setError(MESSAGES.createRoomFailed);
      }
    } catch (err) {
      console.error('Request failed:', err);
      setError(MESSAGES.createRoomFailed);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <UserGuard>
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{UI_TEXT.createRoom}</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{UI_TEXT.roomName}</label>
            <Input
              type="text"
              placeholder={UI_TEXT.roomNamePlaceholder}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={50}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {UI_TEXT.roomNameHelp}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">{UI_TEXT.streamUrl}</label>
            <Input
              type="url"
              placeholder={UI_TEXT.streamUrlPlaceholder}
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {UI_TEXT.streamUrlHelp}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isCreating ? MESSAGES.creatingRoom : UI_TEXT.createRoom}
          </Button>
        </div>
      </div>
    </main>
    </UserGuard>
  );
}
