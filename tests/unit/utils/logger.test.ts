import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/utils/logger";

// Mock console methods
const mockConsole = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
} as any;

global.console = mockConsole;

describe("Logger", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        // Reset environment to default state
        resetTestEnv();
    });

    describe("Log Levels", () => {
        it("should log debug messages in development", () => {
            process.env.NODE_ENV = "development";

            logger.debug("Debug message");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("[DEBUG] Debug message"),
            );
        });

        it("should not log debug messages in production", () => {
            process.env.NODE_ENV = "production";

            logger.debug("Debug message");

            expect(mockConsole.log).not.toHaveBeenCalled();
        });

        it("should always log error messages", () => {
            process.env.NODE_ENV = "production";

            logger.error("Error message");

            expect(mockConsole.error).toHaveBeenCalledWith(
                expect.stringContaining("[ERROR] Error message"),
            );
        });
    });

    describe("Basic Logging Methods", () => {
        beforeEach(() => {
            // Set to development to enable all logging
            process.env.NODE_ENV = "development";
        });

        it("should log info messages with timestamp", () => {
            logger.info("Info message");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("[INFO] Info message"),
            );
        });

        it("should log warning messages", () => {
            logger.warn("Warning message");

            expect(mockConsole.warn).toHaveBeenCalledWith(
                expect.stringContaining("[WARN] Warning message"),
            );
        });

        it("should log error messages", () => {
            logger.error("Error message");

            expect(mockConsole.error).toHaveBeenCalledWith(
                expect.stringContaining("[ERROR] Error message"),
            );
        });

        it("should handle multiple arguments", () => {
            logger.info("Multiple", "arguments", 123, { key: "value" });

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("Multiple arguments 123"),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"key": "[REDACTED]"'),
            );
        });
    });

    describe("Sensitive Data Redaction", () => {
        beforeEach(() => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "production",
                writable: true,
            }); // Enable redaction
        });

        it("should redact email addresses", () => {
            logger.info("User email: test@example.com");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("[EMAIL_REDACTED]"),
            );
            expect(mockConsole.log).not.toHaveBeenCalledWith(
                expect.stringContaining("test@example.com"),
            );
        });

        it("should redact JWT tokens", () => {
            const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
            logger.info("Token:", token);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("[TOKEN_REDACTED]"),
            );
        });

        it("should partially redact UUIDs", () => {
            const uuid = "12345678-abcd-ef12-3456-789012345678";
            logger.info("UUID:", uuid);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("12345678***"),
            );
            expect(mockConsole.log).not.toHaveBeenCalledWith(
                expect.stringContaining(uuid),
            );
        });

        it("should redact API keys", () => {
            logger.info("API_KEY=sk-12345678901234567890123456789012");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("API_KEY=[REDACTED]"),
            );
        });

        it("should redact passwords", () => {
            logger.info("password=secret123");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("password=[REDACTED]"),
            );
        });

        it("should redact sensitive object keys", () => {
            const obj = {
                username: "test",
                password: "secret",
                token: "abc123",
                normalField: "value",
            };

            logger.info("Object:", obj);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("password=[REDACTED]"),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"token": "[REDACTED]"'),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"normalField": "value"'),
            );
        });
    });

    describe("Object Sanitization", () => {
        beforeEach(() => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "development",
                writable: true,
            });
        });

        it("should sanitize Error objects", () => {
            const error = new Error("Test error");
            error.stack = "stack trace";

            logger.info("Error:", error);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"name": "Error"'),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"message": "Test error"'),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"stack": "stack trace"'),
            );
        });

        it("should handle circular references", () => {
            const obj: any = { name: "test" };
            obj.self = obj;

            logger.info("Circular:", obj);

            // The logger shows the circular reference structure up to max depth
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"name": "test"'),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("[Max Depth Reached]"),
            );
        });

        it("should replace functions with [Function]", () => {
            const obj = {
                func: () => {},
                data: "value",
            };

            logger.info("Object with function:", obj);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('"func": "[Function]"'),
            );
        });

        it("should handle arrays", () => {
            const arr = [1, "two", { three: 3 }];

            logger.info("Array:", arr);

            // The logger uses JSON.stringify with 2-space indentation
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('[\n  1,\n  "two"'),
            );
        });
    });

    describe("Specialized Logging Methods", () => {
        beforeEach(() => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "development",
                writable: true,
            });
        });

        it("should log user actions with redacted ID", () => {
            const userId = "12345678-abcd-ef12-3456-789012345678";
            logger.userAction("created room", userId, { roomName: "Test Room" });

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("User 12345678*** created room"),
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("Test Room"),
            );
        });

        it("should log room actions with redacted IDs", () => {
            const roomId = "87654321-dcba-hgfe-lkji-210987654321";
            const userId = "12345678-abcd-efgh-ijkl-123456789012";

            logger.roomAction("updated permissions", roomId, userId, { canPlay: true });

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("Room 87654321*** updated permissions by user 12345678***"),
            );
        });

        it("should log API requests", () => {
            logger.apiRequest("POST", "/api/rooms", 201, 45);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("POST /api/rooms -> 201 (45ms)"),
            );
        });

        it("should log authentication events", () => {
            const userId = "12345678-abcd-ef12-3456-789012345678";

            logger.authEvent("login", userId);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("Auth: login for user 12345678***"),
            );
        });

        it("should log failed authentication as warning", () => {
            logger.authEvent("auth_failed", undefined, "Invalid credentials");

            expect(mockConsole.warn).toHaveBeenCalledWith(
                expect.stringContaining("Auth: auth_failed for user anonymous - Invalid credentials"),
            );
        });

        it("should log rate limit events", () => {
            logger.rateLimitEvent("192.168.1.1", "create_room", true);

            expect(mockConsole.warn).toHaveBeenCalledWith(
                expect.stringContaining("Rate limit BLOCKED: create_room for 192.168.1.1"),
            );
        });

        it("should log allowed rate limit events as debug", () => {
            logger.rateLimitEvent("192.168.1.1", "create_room", false);

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("Rate limit allowed: create_room for 192.168.1.1"),
            );
        });

        it("should log security events as errors", () => {
            logger.securityEvent("XSS attempt detected", "high", { input: "<script>" });

            expect(mockConsole.error).toHaveBeenCalledTimes(1); // Only message is logged
            expect(mockConsole.error).toHaveBeenCalledWith(
                expect.stringContaining("[SECURITY HIGH] XSS attempt detected"),
            );
        });
    });

    describe("Color Output", () => {
        it("should add colors in development", () => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "development",
                writable: true,
            });

            logger.info("Colored message");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("\x1b[32m"), // Green color
            );
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("\x1b[0m"), // Reset color
            );
        });

        it("should not add colors in production", () => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "production",
                writable: true,
            });

            logger.info("Plain message");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.not.stringContaining("\x1b["),
            );
        });
    });

    describe("Timestamp Configuration", () => {
        it("should include timestamps by default", () => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "development",
                writable: true,
            });

            logger.info("Message with timestamp");

            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
            );
        });
    });

    describe("Log Level Configuration", () => {
        it("should use INFO level in production", () => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "production",
                writable: true,
            });

            logger.debug("Should not log");
            logger.info("Should log");

            expect(mockConsole.log).toHaveBeenCalledTimes(1);
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining("[INFO] Should log"),
            );
        });

        it("should use DEBUG level in development", () => {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "development",
                writable: true,
            });

            logger.debug("Should log");
            logger.info("Should also log");

            expect(mockConsole.log).toHaveBeenCalledTimes(2);
        });
    });
});
