import { NextRequest, NextResponse } from 'next/server';
import { authRateLimiter, checkRateLimit } from '@/lib/middleware/rateLimiter';
import { getSessionFromRequest, destroySessionCookie } from '@/lib/utils/sessionManager';
import { logger } from '@/lib/utils/logger';
import { withErrorHandler, UnauthorizedError } from '@/lib/utils/errorHandler';

/**
 * DELETE /api/auth/delete-user
 * 
 * Validates and acknowledges deletion of anonymous user identity.
 * Destroys the secure session cookie.
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User identity cleared"
 * }
 * 
 * Security:
 * - Rate limited: 10 requests per hour per IP
 * - Session validation: Requires valid cookie
 * - Secure cookie destruction (Phase 3)
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting - prevent abuse
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  try {
    await checkRateLimit(authRateLimiter, clientIp);
  } catch (error) {
    logger.rateLimitEvent(clientIp, 'delete_user', true);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Get session from cookie
  const session = getSessionFromRequest(request);

  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }

  // Create success response
  const response = NextResponse.json({
    success: true,
    message: 'User identity cleared',
  }, { status: 200 });

  // Destroy the session cookie
  destroySessionCookie(response);

  logger.authEvent('logout', session.userId, 'User deleted account');

  return response;
}, 'DELETE /api/auth/delete-user');
