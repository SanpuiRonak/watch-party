import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/utils/jwt';
import { authRateLimiter, checkRateLimit } from '@/lib/middleware/rateLimiter';

/**
 * DELETE /api/auth/delete-user
 * 
 * Validates and acknowledges deletion of anonymous user identity.
 * 
 * In an anonymous system, this endpoint:
 * - Verifies the JWT token is valid
 * - Confirms the user identity can be cleared
 * - Actual deletion happens client-side (remove JWT from localStorage)
 * 
 * Headers:
 * Authorization: Bearer <jwt-token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User identity cleared",
 *   "userId": string
 * }
 * 
 * Security:
 * - Rate limited: 10 requests per hour per IP
 * - JWT verification: Ensures valid token
 * 
 * TODO: Integrate with UI
 * 1. Add "Clear Identity" or "Logout" button in UI
 * 2. Call this endpoint with JWT from localStorage
 * 3. On success, remove JWT from localStorage
 * 4. Redirect to homepage or show "create user" flow
 * 5. Optionally: Add confirmation dialog before deletion
 * 
 * Future Enhancement:
 * - If user preferences/history is added to database, delete that data here
 * - Add ability to delete associated rooms created by user
 * - Add logging for analytics/security monitoring
 */
export async function DELETE(request: NextRequest) {
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

    // Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid token';
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    // Token is valid - acknowledge deletion
    // Note: In anonymous system, no database cleanup needed
    // Client will remove JWT from localStorage
    
    console.log(`User identity cleared: ${payload.userId}`);

    return NextResponse.json({
      success: true,
      message: 'User identity cleared',
      userId: payload.userId,
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
