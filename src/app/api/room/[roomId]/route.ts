import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/services/roomManager';
import { logger } from '@/lib/utils/logger';
import { withErrorHandler, NotFoundError } from '@/lib/utils/errorHandler';
import { apiRateLimiter, checkRateLimit } from '@/lib/middleware/rateLimiter';

const roomManager = new RoomManager();

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) => {
  // Rate limiting - prevent abuse
  const clientIp = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  try {
    await checkRateLimit(apiRateLimiter, clientIp);
  } catch (error) {
    logger.rateLimitEvent(clientIp, 'get_room', true);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { roomId } = await params;
  const room = await roomManager.getRoom(roomId);
  
  if (!room) {
    throw new NotFoundError('Room');
  }

  logger.debug('Room retrieved', { roomId });

  return NextResponse.json(room);
}, 'GET /api/rooms/[roomId]');
