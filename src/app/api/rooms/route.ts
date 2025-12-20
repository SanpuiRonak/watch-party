import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { Room, CreateRoomRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { streamUrl, ownerId }: CreateRoomRequest = await request.json();
    
    if (!streamUrl || !ownerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomId = crypto.randomUUID();
    const room: Room = {
      id: roomId,
      ownerId,
      streamUrl,
      videoState: {
        lastEventTime: 0,
        lastEventTimestamp: Date.now(),
        isPlaying: false,
        playbackRate: 1
      },
      permissions: {
        canPlay: true,
        canSeek: true
      },
      participants: [ownerId],
      createdAt: Date.now()
    };

    await redis.setex(`room:${roomId}`, 86400, JSON.stringify(room));
    
    return NextResponse.json({ roomId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}