'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateRoom() {
  const router = useRouter();
  const { user } = useUser();
  const [streamUrl, setStreamUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!streamUrl.trim()) {
      setError('Please enter a stream URL');
      return;
    }

    setIsCreating(true);
    setError('');
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl: streamUrl,
          ownerId: user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/room/${data.roomId}`);
      } else {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        setError('Failed to create room. Please try again.');
      }
    } catch (err) {
      console.error('Request failed:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create Room</h1>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Stream URL</label>
            <Input
              type="url"
              placeholder="https://example.com/video.mp4"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter a direct video URL (MP4, HLS, etc.)
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
            {isCreating ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </div>
    </main>
  );
}