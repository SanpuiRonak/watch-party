import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/utils/sessionManager';
import { logger } from '@/lib/utils/logger';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/auth/session
 * 
 * Validates and returns the current session information.
 * 
 * Response (authenticated):
 * {
 *   "authenticated": true,
 *   "user": {
 *     "id": string,
 *     "username": string
 *   }
 * }
 * 
 * Response (not authenticated):
 * {
 *   "authenticated": false
 * }
 * 
 * Security:
 * - Validates session cookie
 * - Returns user info only if valid session exists
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({
      authenticated: false,
    });
  }

  logger.debug('Session validated', { userId: session.userId });

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      username: session.username,
    },
  });
}, 'GET /api/auth/session');
