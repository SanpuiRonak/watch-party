import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/services/roomManager';
import { CreateRoomRequest } from '@/lib/types';
import { secureLogger } from '@/lib/utils/security';

const roomManager = new RoomManager();

export async function POST(request: NextRequest) {
  try {
    const { roomName, streamUrl, ownerId, ownerName }: CreateRoomRequest = await request.json();
    
    if (!roomName || !streamUrl || !ownerId || !ownerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomId = crypto.randomUUID();
    
    // Validation and sanitization is now handled in roomManager.createRoom()
    // which validates: roomId, roomName, streamUrl, ownerId, ownerName
    const room = await roomManager.createRoom(roomId, roomName, streamUrl, ownerId, ownerName);
    
    return NextResponse.json({ roomId });
  } catch (error) {
    secureLogger.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
