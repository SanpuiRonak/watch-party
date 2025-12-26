import { describe, expect, it } from "vitest";
import {
    redactId,
    sanitizeRoomName,
    sanitizeTextInput,
    sanitizeUsername,
    validateCurrentTime,
    validateNumber,
    validatePermissions,
    validatePlaybackRate,
    validateRoomId,
    validateStreamUrlFormat,
    validateString,
    validateUserId,
    validateVideoEventType,
} from "@/lib/utils/security";

describe("Security Utilities", () => {
    describe("validateString", () => {
        it("should return valid string", () => {
            expect(validateString("hello", "test")).toBe("hello");
        });

        it("should throw for non-string values", () => {
            expect(() => validateString(123, "test")).toThrow("test must be a string");
            expect(() => validateString({}, "test")).toThrow("test must be a string");
            expect(() => validateString(null, "test")).toThrow("test must be a string");
        });

        it("should throw for empty string", () => {
            expect(() => validateString("", "test")).toThrow("test cannot be empty");
        });

        it("should throw for string exceeding max length", () => {
            const longString = "a".repeat(1001);
            expect(() => validateString(longString, "test", 1000)).toThrow(
                "test exceeds maximum length of 1000",
            );
        });

        it("should accept custom max length", () => {
            const str = "a".repeat(50);
            expect(validateString(str, "test", 100)).toBe(str);
        });
    });

    describe("validateRoomId", () => {
        it("should accept valid UUID v4", () => {
            const validUuid = "12345678-1234-4123-8123-123456789012";
            expect(validateRoomId(validUuid)).toBe(validUuid);
        });

        it("should throw for invalid UUID format", () => {
            expect(() => validateRoomId("not-a-uuid")).toThrow("Invalid roomId format");
            expect(() => validateRoomId("12345678-1234-5123-8123-123456789012")).toThrow(
                "Invalid roomId format",
            ); // version 5 instead of 4
        });

        it("should throw for non-string values", () => {
            expect(() => validateRoomId(123)).toThrow("roomId must be a string");
        });

        it("should throw for empty string", () => {
            expect(() => validateRoomId("")).toThrow("roomId cannot be empty");
        });
    });

    describe("validateUserId", () => {
        it("should accept valid user IDs", () => {
            expect(validateUserId("user123")).toBe("user123");
            expect(validateUserId("user_123")).toBe("user_123");
            expect(validateUserId("user-123")).toBe("user-123");
            expect(validateUserId("User_123-ABC")).toBe("User_123-ABC");
        });

        it("should throw for invalid characters", () => {
            expect(() => validateUserId("user@123")).toThrow(
                "Invalid userId format - only alphanumeric characters, hyphens, and underscores allowed",
            );
            expect(() => validateUserId("user 123")).toThrow(
                "Invalid userId format - only alphanumeric characters, hyphens, and underscores allowed",
            );
            expect(() => validateUserId("user.123")).toThrow(
                "Invalid userId format - only alphanumeric characters, hyphens, and underscores allowed",
            );
        });

        it("should throw for non-string values", () => {
            expect(() => validateUserId(123)).toThrow("userId must be a string");
        });
    });

    describe("sanitizeUsername", () => {
        it("should sanitize valid usernames", () => {
            expect(sanitizeUsername("john_doe")).toBe("john_doe");
            expect(sanitizeUsername("John Doe")).toBe("John Doe");
            expect(sanitizeUsername("user-123")).toBe("user-123");
        });

        it("should remove dangerous characters", () => {
            expect(sanitizeUsername("user<script>")).toBe("user");
            expect(sanitizeUsername("user<>")).toBe("user");
            expect(sanitizeUsername("user'&\"")).toBe("user");
        });

        it("should trim whitespace", () => {
            expect(sanitizeUsername("  user  ")).toBe("user");
        });

        it("should throw for usernames that become empty after sanitization", () => {
            expect(() => sanitizeUsername("<script>")).toThrow(
                "Username must contain at least one valid character",
            );
        });

        it("should throw for non-string values", () => {
            expect(() => sanitizeUsername(123)).toThrow("username must be a string");
        });
    });

    describe("sanitizeRoomName", () => {
        it("should sanitize room names", () => {
            expect(sanitizeRoomName("My Awesome Room")).toBe("My Awesome Room");
            expect(sanitizeRoomName("Room #123")).toBe("Room #123");
        });

        it("should remove HTML tags", () => {
            expect(sanitizeRoomName("Room <b>test</b>")).toBe("Room test");
        });

        it("should remove dangerous characters", () => {
            expect(sanitizeRoomName("Room & test")).toBe("Room  test");
        });

        it("should throw for room names that become empty", () => {
            expect(() => sanitizeRoomName("<>")).toThrow(
                "Room name must contain at least one valid character",
            );
        });
    });

    describe("sanitizeTextInput", () => {
        it("should sanitize text input", () => {
            expect(sanitizeTextInput("Hello <b>world</b>", "text")).toBe("Hello world");
            expect(sanitizeTextInput("Test & more", "text")).toBe("Test  more");
        });

        it("should respect max length", () => {
            const longText = "a".repeat(100);
            expect(() => sanitizeTextInput(longText, "text", 50)).toThrow(
                "text exceeds maximum length of 50",
            );
        });
    });

    describe("validateNumber", () => {
        it("should validate numbers", () => {
            expect(validateNumber(42, "test")).toBe(42);
            expect(validateNumber(3.14, "test")).toBe(3.14);
        });

        it("should throw for non-numbers", () => {
            expect(() => validateNumber("42", "test")).toThrow("test must be a finite number");
            expect(() => validateNumber(NaN, "test")).toThrow("test must be a finite number");
            expect(() => validateNumber(Infinity, "test")).toThrow("test must be a finite number");
        });

        it("should validate min/max constraints", () => {
            expect(validateNumber(5, "test", 0, 10)).toBe(5);
            expect(() => validateNumber(-1, "test", 0, 10)).toThrow("test must be >= 0");
            expect(() => validateNumber(15, "test", 0, 10)).toThrow("test must be <= 10");
        });
    });

    describe("validateVideoEventType", () => {
        it("should accept valid event types", () => {
            expect(validateVideoEventType("play")).toBe("play");
            expect(validateVideoEventType("pause")).toBe("pause");
            expect(validateVideoEventType("seek")).toBe("seek");
        });

        it("should throw for invalid event types", () => {
            expect(() => validateVideoEventType("invalid")).toThrow(
                "eventType must be one of: play, pause, seek",
            );
            expect(() => validateVideoEventType(123)).toThrow("eventType must be a string");
        });
    });

    describe("validateCurrentTime", () => {
        it("should validate current time", () => {
            expect(validateCurrentTime(0)).toBe(0);
            expect(validateCurrentTime(3600)).toBe(3600); // 1 hour
            expect(validateCurrentTime(86399)).toBe(86399); // Almost 24 hours
        });

        it("should throw for invalid times", () => {
            expect(() => validateCurrentTime(-1)).toThrow("currentTime must be >= 0");
            expect(() => validateCurrentTime(86401)).toThrow("currentTime must be <= 86400");
            expect(() => validateCurrentTime("123")).toThrow("currentTime must be a finite number");
        });
    });

    describe("validatePlaybackRate", () => {
        it("should validate playback rates", () => {
            expect(validatePlaybackRate(1)).toBe(1);
            expect(validatePlaybackRate(0.25)).toBe(0.25);
            expect(validatePlaybackRate(4)).toBe(4);
        });

        it("should return default value for undefined/null", () => {
            expect(validatePlaybackRate(undefined)).toBe(1);
            expect(validatePlaybackRate(null)).toBe(1);
        });

        it("should throw for invalid rates", () => {
            expect(() => validatePlaybackRate(0.1)).toThrow("playbackRate must be >= 0.25");
            expect(() => validatePlaybackRate(5)).toThrow("playbackRate must be <= 4");
        });
    });

    describe("validatePermissions", () => {
        it("should validate permission objects", () => {
            const validPerms = {
                canPlay: true,
                canSeek: false,
                canChangeSpeed: true,
            };
            expect(validatePermissions(validPerms)).toEqual(validPerms);
        });

        it("should throw for invalid permission objects", () => {
            expect(() => validatePermissions("invalid")).toThrow("permissions must be an object");
            expect(() => validatePermissions({})).toThrow("permissions.canPlay must be a boolean");
            expect(() =>
                validatePermissions({ canPlay: "true", canSeek: false, canChangeSpeed: true }),
            ).toThrow("permissions.canPlay must be a boolean");
        });
    });

    describe("validateStreamUrlFormat", () => {
        it("should accept valid HTTP/HTTPS URLs", () => {
            expect(validateStreamUrlFormat("https://example.com/video.mp4")).toBe(
                "https://example.com/video.mp4",
            );
            expect(validateStreamUrlFormat("http://example.com/video.mp4")).toBe(
                "http://example.com/video.mp4",
            );
        });

        it("should throw for invalid protocols", () => {
            expect(() => validateStreamUrlFormat("ftp://example.com/video.mp4")).toThrow(
                "Stream URL must use HTTP or HTTPS protocol",
            );
            expect(() => validateStreamUrlFormat("file:///path/video.mp4")).toThrow(
                "Stream URL must use HTTP or HTTPS protocol",
            );
        });

        it("should block localhost and private IPs", () => {
            expect(() => validateStreamUrlFormat("http://localhost/video.mp4")).toThrow(
                "Stream URL cannot point to local or private addresses",
            );
            expect(() => validateStreamUrlFormat("http://127.0.0.1/video.mp4")).toThrow(
                "Stream URL cannot point to local or private addresses",
            );
            expect(() => validateStreamUrlFormat("http://192.168.1.1/video.mp4")).toThrow(
                "Stream URL cannot point to private IP addresses",
            );
            expect(() => validateStreamUrlFormat("http://10.0.0.1/video.mp4")).toThrow(
                "Stream URL cannot point to private IP addresses",
            );
        });

        it("should throw for invalid URL format", () => {
            expect(() => validateStreamUrlFormat("not-a-url")).toThrow(
                "Invalid stream URL format",
            );
        });
    });

    describe("redactId", () => {
        it("should redact long IDs", () => {
            expect(redactId("12345678-1234-4123-8123-123456789012")).toBe(
                "12345678***",
            );
            expect(redactId("user123456789")).toBe("user1234***");
        });

        it("should fully redact short IDs", () => {
            expect(redactId("short")).toBe("***");
            expect(redactId("")).toBe("***");
        });
    });
});
