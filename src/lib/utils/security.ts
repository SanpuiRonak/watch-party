/**
 * Security utilities for input validation and sanitization
 * Addresses Critical Vulnerabilities: NoSQL Injection, XSS, Socket.io Security
 */

// ============================================================================
// NoSQL Injection Prevention
// ============================================================================

/**
 * Validates that a value is a string and not an object (prevents NoSQL injection)
 */
export function validateString(value: unknown, fieldName: string, maxLength = 1000): string {
    if (typeof value !== "string") {
        throw new Error(`${fieldName} must be a string`);
    }
    if (value.length === 0) {
        throw new Error(`${fieldName} cannot be empty`);
    }
    if (value.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
    }
    return value;
}

/**
 * Validates Room ID format (UUID v4)
 * Prevents NoSQL injection by ensuring only valid UUID format
 */
export function validateRoomId(roomId: unknown): string {
    const sanitized = validateString(roomId, "roomId", 100);

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(sanitized)) {
        throw new Error("Invalid roomId format - must be a valid UUID");
    }

    return sanitized;
}

/**
 * Validates User ID format
 * Prevents NoSQL injection by ensuring only alphanumeric + hyphens
 */
export function validateUserId(userId: unknown): string {
    const sanitized = validateString(userId, "userId", 100);

    // Allow alphanumeric, hyphens, and underscores only
    const validUserIdRegex = /^[a-zA-Z0-9_-]+$/;

    if (!validUserIdRegex.test(sanitized)) {
        throw new Error(
            "Invalid userId format - only alphanumeric characters, hyphens, and underscores allowed",
        );
    }

    return sanitized;
}

// ============================================================================
// XSS Prevention
// ============================================================================

/**
 * Sanitizes username to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeUsername(username: unknown): string {
    const str = validateString(username, "username", 50);

    // Remove HTML tags, script tags, and dangerous characters
    // Allow only: letters, numbers, spaces, hyphens, underscores, dots
    const sanitized = str
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[<>'"&;(){}[\]]/g, "") // Remove dangerous characters
        .replace(/[^a-zA-Z0-9\s\-_.]/g, "") // Keep only safe characters
        .trim();

    if (sanitized.length === 0) {
        throw new Error("Username must contain at least one valid character");
    }

    return sanitized;
}

/**
 * Sanitizes room name to prevent XSS attacks
 */
export function sanitizeRoomName(roomName: unknown): string {
    const str = validateString(roomName, "roomName", 100);

    // Remove HTML tags and dangerous characters but allow more characters than username
    const sanitized = str
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[<>'"&;(){}[\]]/g, "") // Remove dangerous characters
        .trim();

    if (sanitized.length === 0) {
        throw new Error("Room name must contain at least one valid character");
    }

    return sanitized;
}

/**
 * Sanitizes generic text input to prevent XSS
 */
export function sanitizeTextInput(input: unknown, fieldName: string, maxLength = 1000): string {
    const str = validateString(input, fieldName, maxLength);

    // Remove HTML tags and dangerous characters
    const sanitized = str
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[<>"'&;]/g, "") // Remove dangerous characters
        .trim();

    return sanitized;
}

// ============================================================================
// Socket.io Parameter Validation
// ============================================================================

/**
 * Validates numeric parameters for Socket.io events
 */
export function validateNumber(
    value: unknown,
    fieldName: string,
    min?: number,
    max?: number,
): number {
    if (typeof value !== "number" || !isFinite(value)) {
        throw new Error(`${fieldName} must be a finite number`);
    }

    if (min !== undefined && value < min) {
        throw new Error(`${fieldName} must be >= ${min}`);
    }

    if (max !== undefined && value > max) {
        throw new Error(`${fieldName} must be <= ${max}`);
    }

    return value;
}

/**
 * Validates video event type
 */
export function validateVideoEventType(eventType: unknown): "play" | "pause" | "seek" {
    if (typeof eventType !== "string") {
        throw new Error("eventType must be a string");
    }

    const validTypes = ["play", "pause", "seek"];
    if (!validTypes.includes(eventType)) {
        throw new Error(`eventType must be one of: ${validTypes.join(", ")}`);
    }

    return eventType as "play" | "pause" | "seek";
}

/**
 * Validates current time for video playback (in seconds)
 */
export function validateCurrentTime(currentTime: unknown): number {
    return validateNumber(currentTime, "currentTime", 0, 86400); // Max 24 hours
}

/**
 * Validates playback rate
 */
export function validatePlaybackRate(playbackRate: unknown): number {
    if (playbackRate === undefined || playbackRate === null) {
        return 1; // Default playback rate
    }
    return validateNumber(playbackRate, "playbackRate", 0.25, 4); // 0.25x to 4x speed
}

/**
 * Validates room permissions object
 */
export function validatePermissions(permissions: unknown): {
    canPlay: boolean;
    canSeek: boolean;
    canChangeSpeed: boolean;
} {
    if (typeof permissions !== "object" || permissions === null) {
        throw new Error("permissions must be an object");
    }

    const perms = permissions as Record<string, unknown>;

    if (typeof perms.canPlay !== "boolean") {
        throw new Error("permissions.canPlay must be a boolean");
    }
    if (typeof perms.canSeek !== "boolean") {
        throw new Error("permissions.canSeek must be a boolean");
    }
    if (typeof perms.canChangeSpeed !== "boolean") {
        throw new Error("permissions.canChangeSpeed must be a boolean");
    }

    return {
        canPlay: perms.canPlay,
        canSeek: perms.canSeek,
        canChangeSpeed: perms.canChangeSpeed,
    };
}

/**
 * Validates stream URL format and prevents SSRF
 */
export function validateStreamUrlFormat(url: unknown): string {
    const urlStr = validateString(url, "streamUrl", 2000);

    try {
        const parsedUrl = new URL(urlStr);

        // Only allow HTTP(S) protocols
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Stream URL must use HTTP or HTTPS protocol");
        }

        // Block localhost and private IPs to prevent SSRF
        const hostname = parsedUrl.hostname.toLowerCase();
        const blockedHosts = [
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "169.254.169.254", // AWS metadata
            "::1",
            "[::1]",
        ];

        if (blockedHosts.includes(hostname)) {
            throw new Error("Stream URL cannot point to local or private addresses");
        }

        // Check for private IP ranges
        if (isPrivateIP(hostname)) {
            throw new Error("Stream URL cannot point to private IP addresses");
        }

        return urlStr;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error("Invalid stream URL format");
        }
        throw error;
    }
}

/**
 * Checks if a hostname is a private IP address
 */
function isPrivateIP(hostname: string): boolean {
    // Check IPv4 private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);

    if (match) {
        const parts = match.slice(1).map(Number);

        // Check if any part is invalid (> 255)
        if (parts.some(part => part > 255)) {
            return false;
        }

        // Private ranges:
        // 10.0.0.0 - 10.255.255.255
        // 172.16.0.0 - 172.31.255.255
        // 192.168.0.0 - 192.168.255.255
        return (
            parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168)
        );
    }

    return false;
}

// ============================================================================
// Logging Utilities (Sanitize sensitive data in logs)
// ============================================================================

/**
 * Partially redacts sensitive IDs for logging
 */
export function redactId(id: string): string {
    if (id.length <= 8) {
        return "***";
    }
    return `${id.substring(0, 8)}***`;
}

/**
 * Safe logger that redacts sensitive information
 */
export const secureLogger = {
    debug: (...args: unknown[]) => {
        if (process.env.NODE_ENV !== "production") {
            console.log(...args);
        }
    },
    info: (...args: unknown[]) => console.log(...args),
    error: (...args: unknown[]) => console.error(...args),
    userAction: (action: string, userId: string) => {
        console.log(`User ${redactId(userId)} performed ${action}`);
    },
    roomAction: (action: string, roomId: string, userId?: string) => {
        if (userId) {
            console.log(`${action} in room ${redactId(roomId)} by user ${redactId(userId)}`);
        } else {
            console.log(`${action} in room ${redactId(roomId)}`);
        }
    },
};
