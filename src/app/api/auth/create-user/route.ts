import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/utils/jwt';
import { sanitizeUsername, validateUserId } from '@/lib/utils/security';
import { authRateLimiter, checkRateLimit } from '@/lib/middleware/rateLimiter';

/**
 * POST /api/auth/create-user
 * 
 * Creates a new anonymous user identity and returns a JWT token.
 * 
 * Request Body:
 * {
 *   "username": string (3-50 chars, alphanumeric + spaces/dashes/underscores)
 * }
 * 
 * Response:
 * {
 *   "token": string (JWT with no expiration),
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
 * 
 * TODO: Integrate with UI
 * 1. Update UserSetup.tsx to call this endpoint instead of creating user client-side
 * 2. Store returned JWT in localStorage (not user object)
 * 3. Update useUser.ts to decode JWT for display purposes
 * 4. Remove client-side user creation logic from useUser.ts
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent abuse
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    try {
      await checkRateLimit(authRateLimiter, clientIp);
    } catch (error) {
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
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Sanitize username (XSS protection)
    const sanitizedUsername = sanitizeUsername(username);

    // Additional validation
    if (sanitizedUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (sanitizedUsername.length > 50) {
      return NextResponse.json(
        { error: 'Username must be less than 50 characters' },
        { status: 400 }
      );
    }

    // Generate UUID for user ID
    const userId = crypto.randomUUID();

    // Validate the generated UUID (paranoid check)
    validateUserId(userId);

    // Generate JWT token (no expiration for anonymous users)
    const token = generateToken(userId, sanitizedUsername);

    // Return token and user data
    return NextResponse.json({
      token,
      user: {
        id: userId,
        username: sanitizedUsername,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
