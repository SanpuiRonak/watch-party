import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/services/roomManager';
import { RoomPermissions } from '@/lib/types';

const roomManager = new RoomManager();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { permissions, ownerId }: { permissions: RoomPermissions; ownerId: string } = await request.json();
    
    const room = await roomManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Verify owner
    if (room.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await roomManager.updatePermissions(roomId, permissions);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}