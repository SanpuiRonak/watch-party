import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/services/roomManager';
import { RoomPermissions } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { withErrorHandler, NotFoundError, ForbiddenError } from '@/lib/utils/errorHandler';
import { validatePermissionsRequest } from '@/lib/middleware/requestValidation';

const roomManager = new RoomManager();

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) => {
  const { roomId } = await params;
  const body = await request.json();
  
  // Validate request body
  const { permissions, ownerId } = validatePermissionsRequest(body);
  
  // Get room and validate it exists
  const room = await roomManager.getRoom(roomId);
  if (!room) {
    throw new NotFoundError('Room');
  }
  
  // Verify owner authorization
  if (room.ownerId !== ownerId) {
    logger.warn('Unauthorized permissions update attempt', { roomId, ownerId });
    throw new ForbiddenError('Only room owner can update permissions');
  }

  await roomManager.updatePermissions(roomId, permissions);
  
  logger.roomAction('updated permissions', roomId, ownerId, { permissions });
  
  return NextResponse.json({ success: true });
}, 'PUT /api/rooms/[roomId]/permissions');
