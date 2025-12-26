import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie } from "@/lib/utils/sessionManager";
import { sanitizeUsername } from "@/lib/utils/security";
import { logger } from "@/lib/utils/logger";
import { ValidationError, withErrorHandler } from "@/lib/utils/errorHandler";
import { apiRateLimiter, checkRateLimit } from "@/lib/middleware/rateLimiter";

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
export const GET = withErrorHandler(async(request: NextRequest) => {
    // Rate limiting - prevent abuse
    const clientIp =
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    try {
        await checkRateLimit(apiRateLimiter, clientIp);
    } catch (error) {
        logger.rateLimitEvent(clientIp, "get_session", true);
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 },
        );
    }

    const session = getSessionFromRequest(request);

    if (!session) {
        return NextResponse.json({
            authenticated: false,
        });
    }

    logger.debug("Session validated", { userId: session.userId });

    return NextResponse.json({
        authenticated: true,
        user: {
            id: session.userId,
            username: session.username,
        },
    });
}, "GET /api/auth/session");

/**
 * PUT /api/auth/user
 *
 * Updates the current user's username.
 *
 * Request Body:
 * {
 *   "username": string (3-50 chars, alphanumeric + spaces/dashes/underscores)
 * }
 *
 * Response:
 * {
 *   "user": {
 *     "id": string,
 *     "username": string (sanitized)
 *   }
 * }
 *
 * Security:
 * - Rate limited: 10 requests per hour per IP
 * - Session validation: Requires valid cookie
 * - Input sanitization: XSS protection
 * - Input validation: Format and length checks
 * - Updates JWT token with new username
 */
export const PUT = withErrorHandler(async(request: NextRequest) => {
    // Rate limiting - prevent abuse
    const clientIp =
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    try {
        await checkRateLimit(apiRateLimiter, clientIp);
    } catch (error) {
        logger.rateLimitEvent(clientIp, "update_user", true);
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 },
        );
    }

    // Get session from cookie
    const session = getSessionFromRequest(request);

    if (!session) {
        throw new ValidationError("Authentication required");
    }

    // Parse request body
    const body = await request.json();
    const { username } = body;

    // Validate username exists
    if (!username || typeof username !== "string") {
        throw new ValidationError("Username is required");
    }

    // Sanitize username (XSS protection)
    const sanitizedUsername = sanitizeUsername(username);

    // Additional validation
    if (sanitizedUsername.length < 3) {
        throw new ValidationError("Username must be at least 3 characters");
    }

    if (sanitizedUsername.length > 50) {
        throw new ValidationError("Username must be less than 50 characters");
    }

    // Create response with updated user data
    const response = NextResponse.json(
        {
            user: {
                id: session.userId,
                username: sanitizedUsername,
            },
        },
        { status: 200 },
    );

    // Update session cookie with new username
    setSessionCookie(response, session.userId, sanitizedUsername);

    logger.userAction("updated username", session.userId, {
        oldUsername: session.username,
        newUsername: sanitizedUsername,
    });

    return response;
}, "PUT /api/auth/user");
