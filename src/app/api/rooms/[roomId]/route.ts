import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/services/roomManager';
import { logger } from '@/lib/utils/logger';
import { withErrorHandler, NotFoundError } from '@/lib/utils/errorHandler';

const roomManager = new RoomManager();

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) => {
  const { roomId } = await params;
  const room = await roomManager.getRoom(roomId);
  
  if (!room) {
    throw new NotFoundError('Room');
  }

  logger.debug('Room retrieved', { roomId });

  return NextResponse.json(room);
}, 'GET /api/rooms/[roomId]');
