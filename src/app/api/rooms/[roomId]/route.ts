import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { Room } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const roomData = await redis.get(`room:${roomId}`);
    
    if (!roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room: Room = JSON.parse(roomData);
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}