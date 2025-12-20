import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { Room, RoomPermissions } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { permissions, ownerId }: { permissions: RoomPermissions; ownerId: string } = await request.json();
    
    const roomData = await redis.get(`room:${roomId}`);
    if (!roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room: Room = JSON.parse(roomData);
    
    // Verify owner
    if (room.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    room.permissions = permissions;
    await redis.setex(`room:${roomId}`, 86400, JSON.stringify(room));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}