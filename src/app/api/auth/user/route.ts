import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/utils/sessionManager";
import { logger } from "@/lib/utils/logger";
import { withErrorHandler } from "@/lib/utils/errorHandler";
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
