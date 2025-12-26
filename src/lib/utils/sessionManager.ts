/**
 * Session Manager - Cookie-Based Sessions
 * Addresses Medium Severity Issue #12: Server-Side Sessions
 *
 * Provides secure cookie-based session management with:
 * - httpOnly cookies (prevents XSS access)
 * - Secure flag (requires HTTPS via Traefik)
 * - SameSite protection (CSRF prevention)
 * - JWT-based authentication
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateToken, JWTPayload, verifyToken } from "./jwt";
import { logger } from "./logger";

// ============================================================================
// Configuration
// ============================================================================

function getSessionConfig() {
    return {
        cookieName: "watch-party-session",

        // Cookie options
        httpOnly: true, // Prevents JavaScript access (XSS protection)
        secure: process.env.NODE_ENV === "production", // HTTPS only in production (Traefik handles this)
        sameSite: "strict" as const, // CSRF protection
        path: "/",

        // No maxAge - cookies persist as session cookies (cleared when browser closes)
        // JWT tokens also don't expire - anonymous users can't re-authenticate
    } as const;
}

// ============================================================================
// Session Creation
// ============================================================================

/**
 * Creates a new session by setting a secure cookie
 */
export async function createSession(userId: string, username: string): Promise<void> {
    const token = generateToken(userId, username);
    const config = getSessionConfig();

    const cookieStore = await cookies();
    cookieStore.set(config.cookieName, token, {
        httpOnly: config.httpOnly,
        secure: config.secure,
        sameSite: config.sameSite,
        path: config.path,
    });

    logger.authEvent("login", userId);
}

/**
 * Sets session cookie in a NextResponse
 * Use this when you need to set cookies in API route responses
 */
export function setSessionCookie(
    response: NextResponse,
    userId: string,
    username: string,
): NextResponse {
    const token = generateToken(userId, username);
    const config = getSessionConfig();

    response.cookies.set(config.cookieName, token, {
        httpOnly: config.httpOnly,
        secure: config.secure,
        sameSite: config.sameSite,
        path: config.path,
    });

    logger.authEvent("login", userId);

    return response;
}

// ============================================================================
// Session Retrieval
// ============================================================================

/**
 * Gets the current session from cookies
 * Returns null if no valid session exists
 */
export async function getSession(): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const config = getSessionConfig();
        const sessionCookie = cookieStore.get(config.cookieName);

        if (!sessionCookie) {
            return null;
        }

        const payload = verifyToken(sessionCookie.value);
        return payload;
    } catch (error) {
        logger.authEvent("auth_failed", undefined, "Invalid session token");
        return null;
    }
}

/**
 * Gets session from NextRequest
 * Useful for middleware and API routes
 */
export function getSessionFromRequest(request: NextRequest): JWTPayload | null {
    try {
        const config = getSessionConfig();
        const sessionCookie = request.cookies.get(config.cookieName);

        if (!sessionCookie) {
            return null;
        }

        const payload = verifyToken(sessionCookie.value);
        return payload;
    } catch (error) {
        logger.authEvent("auth_failed", undefined, "Invalid session token");
        return null;
    }
}

/**
 * Validates that a session exists and returns user info
 * Throws error if session is invalid
 */
export async function requireSession(): Promise<JWTPayload> {
    const session = await getSession();

    if (!session) {
        throw new Error("Authentication required");
    }

    return session;
}

/**
 * Validates session from request and returns user info
 * Throws error if session is invalid
 */
export function requireSessionFromRequest(request: NextRequest): JWTPayload {
    const session = getSessionFromRequest(request);

    if (!session) {
        throw new Error("Authentication required");
    }

    return session;
}

// ============================================================================
// Session Destruction
// ============================================================================

/**
 * Destroys the current session by deleting the cookie
 */
export async function destroySession(userId?: string): Promise<void> {
    const cookieStore = await cookies();
    const config = getSessionConfig();
    cookieStore.delete(config.cookieName);

    if (userId) {
        logger.authEvent("logout", userId);
    }
}

/**
 * Destroys session in a NextResponse
 */
export function destroySessionCookie(response: NextResponse): NextResponse {
    const config = getSessionConfig();
    response.cookies.delete(config.cookieName);
    return response;
}

// ============================================================================
// Session Validation
// ============================================================================

/**
 * Checks if a valid session exists
 */
export async function hasValidSession(): Promise<boolean> {
    const session = await getSession();
    return session !== null;
}

/**
 * Checks if request has a valid session
 */
export function hasValidSessionInRequest(request: NextRequest): boolean {
    const session = getSessionFromRequest(request);
    return session !== null;
}

// ============================================================================
// Session Refresh
// ============================================================================

/**
 * Refreshes an existing session by issuing a new token
 * This extends the session expiry time
 */
export async function refreshSession(): Promise<void> {
    const session = await getSession();

    if (!session) {
        throw new Error("No session to refresh");
    }

    // Create new session with same user data
    await createSession(session.userId, session.username);
    logger.authEvent("token_refresh", session.userId);
}

/**
 * Refreshes session in a NextResponse
 */
export function refreshSessionCookie(response: NextResponse, request: NextRequest): NextResponse {
    const session = getSessionFromRequest(request);

    if (!session) {
        return response;
    }

    return setSessionCookie(response, session.userId, session.username);
}

// ============================================================================
// Helper: Get User ID from Session
// ============================================================================

/**
 * Gets the current user ID from session
 * Returns null if no session
 */
export async function getCurrentUserId(): Promise<string | null> {
    const session = await getSession();
    return session?.userId || null;
}

/**
 * Gets user ID from request
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
    const session = getSessionFromRequest(request);
    return session?.userId || null;
}

/**
 * Gets the current username from session
 * Returns null if no session
 */
export async function getCurrentUsername(): Promise<string | null> {
    const session = await getSession();
    return session?.username || null;
}

// ============================================================================
// Migration Helper
// ============================================================================

/**
 * Checks if user has old localStorage session
 * This is for backward compatibility during migration
 *
 * Client should call this and if returns false, redirect to setup
 */
export function shouldMigrateFromLocalStorage(): boolean {
    // This function is meant to be used client-side
    // Server-side always returns false
    if (typeof globalThis.window === "undefined") {
        return false;
    }

    try {
        const oldUser = globalThis.window.localStorage.getItem("watch-party-user");
        return oldUser !== null;
    } catch {
        return false;
    }
}

/**
 * Clears old localStorage data after migration
 */
export function clearOldLocalStorageSession(): void {
    if (typeof globalThis.window === "undefined") {
        return;
    }

    try {
        globalThis.window.localStorage.removeItem("watch-party-user");
        logger.info("Cleared old localStorage session");
    } catch (error) {
        logger.warn("Failed to clear old localStorage session", error);
    }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Creating a session in an API route
 *
 * export async function POST(request: NextRequest) {
 *   const { username } = await request.json();
 *   const userId = crypto.randomUUID();
 *
 *   const response = NextResponse.json({
 *     user: { id: userId, username }
 *   });
 *
 *   return setSessionCookie(response, userId, username);
 * }
 *
 *
 * Example 2: Getting session in an API route
 *
 * export async function GET(request: NextRequest) {
 *   const session = getSessionFromRequest(request);
 *
 *   if (!session) {
 *     return NextResponse.json(
 *       { error: 'Unauthorized' },
 *       { status: 401 }
 *     );
 *   }
 *
 *   return NextResponse.json({ user: session });
 * }
 *
 *
 * Example 3: Requiring authentication
 *
 * export async function DELETE(request: NextRequest) {
 *   try {
 *     const session = requireSessionFromRequest(request);
 *     // User is authenticated, proceed with deletion
 *     return NextResponse.json({ success: true });
 *   } catch (error) {
 *     return NextResponse.json(
 *       { error: 'Authentication required' },
 *       { status: 401 }
 *     );
 *   }
 * }
 *
 *
 * Example 4: Destroying a session (logout)
 *
 * export async function POST(request: NextRequest) {
 *   const session = getSessionFromRequest(request);
 *   const response = NextResponse.json({ success: true });
 *
 *   if (session) {
 *     destroySessionCookie(response);
 *     logger.authEvent('logout', session.userId);
 *   }
 *
 *   return response;
 * }
 */
