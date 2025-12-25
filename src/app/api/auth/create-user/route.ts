import { NextRequest, NextResponse } from 'next/server';
import { sanitizeUsername, validateUserId } from '@/lib/utils/security';
import { authRateLimiter, checkRateLimit } from '@/lib/middleware/rateLimiter';
import { setSessionCookie } from '@/lib/utils/sessionManager';
import { logger } from '@/lib/utils/logger';
import { withErrorHandler, ValidationError } from '@/lib/utils/errorHandler';

/**
 * POST /api/auth/create-user
 * 
 * Creates a new anonymous user identity and sets a secure session cookie.
 * 
 * Request Body:
 * {
 *   "username": string (3-50 chars, alphanumeric + spaces/dashes/underscores)
 * }
 * 
 * Response:
 * {
 *   "user": {
 *     "id": string (UUID),
 *     "username": string (sanitized)
 *   }
 * }
 * 
 * Security:
 * - Rate limited: 10 requests per hour per IP
 * - Input sanitization: XSS protection
 * - Input validation: Format and length checks
 * - Secure httpOnly cookie for session (Phase 3)
 * - Cookie flags: httpOnly, secure, sameSite=strict
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting - prevent abuse
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  try {
    await checkRateLimit(authRateLimiter, clientIp);
  } catch (error) {
    logger.rateLimitEvent(clientIp, 'create_user', true);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { username } = body;

  // Validate username exists
  if (!username || typeof username !== 'string') {
    throw new ValidationError('Username is required');
  }

  // Sanitize username (XSS protection)
  const sanitizedUsername = sanitizeUsername(username);

  // Additional validation
  if (sanitizedUsername.length < 3) {
    throw new ValidationError('Username must be at least 3 characters');
  }

  if (sanitizedUsername.length > 50) {
    throw new ValidationError('Username must be less than 50 characters');
  }

  // Generate UUID for user ID
  const userId = crypto.randomUUID();

  // Validate the generated UUID (paranoid check)
  validateUserId(userId);

  // Create response with user data
  const response = NextResponse.json({
    user: {
      id: userId,
      username: sanitizedUsername,
    },
  }, { status: 201 });

  // Set secure session cookie (Phase 3 - httpOnly, secure, sameSite)
  setSessionCookie(response, userId, sanitizedUsername);

  logger.userAction('created account', userId, { username: sanitizedUsername });

  return response;
}, 'POST /api/auth/create-user');
