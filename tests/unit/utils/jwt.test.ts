import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import {
    decodeToken,
    extractTokenFromHeader,
    generateToken,
    refreshToken,
    verifyToken,
} from "@/lib/utils/jwt";

// Mock the secureLogger to avoid console output during tests
vi.mock("@/lib/utils/security", () => ({
    secureLogger: {
        error: vi.fn(),
    },
}));

describe("JWT Utilities", () => {
    const testUserId = "user123";
    const testUsername = "testuser";

    beforeEach(() => {
        // Reset environment variable for each test
        process.env.JWT_SECRET = "test-jwt-secret";
    });

    describe("generateToken", () => {
        it("should generate a valid JWT token", () => {
            const token = generateToken(testUserId, testUsername);

            expect(typeof token).toBe("string");
            expect(token.split(".")).toHaveLength(3); // JWT has 3 parts separated by dots
        });

        it("should include correct payload in token", () => {
            const token = generateToken(testUserId, testUsername);
            const decoded = jwt.decode(token) as any; // Use any to access JWT fields

            expect(decoded.userId).toBe(testUserId);
            expect(decoded.username).toBe(testUsername);
            expect(decoded.iss).toBe("watch-party");
            expect(decoded.aud).toBe("watch-party-users");
        });

        it("should not include exp field for anonymous users", () => {
            const token = generateToken(testUserId, testUsername);
            const decoded = jwt.decode(token) as any;

            expect(decoded.exp).toBeUndefined();
        });

        it("should accept any non-empty strings as input", () => {
            // The function doesn't validate input, just generates tokens
            expect(generateToken("", testUsername)).toBeDefined();
            expect(generateToken(testUserId, "")).toBeDefined();
        });
    });

    describe("verifyToken", () => {
        it("should verify a valid token", () => {
            const token = generateToken(testUserId, testUsername);
            const payload = verifyToken(token);

            expect(payload.userId).toBe(testUserId);
            expect(payload.username).toBe(testUsername);
            expect(typeof payload.iat).toBe("number");
        });

        it("should throw for invalid token", () => {
            expect(() => verifyToken("invalid-token")).toThrow("Invalid token");
        });

        it("should throw for token with wrong secret", () => {
            // Generate token with different secret
            const wrongSecret = "wrong-secret";
            const token = jwt.sign(
                { userId: testUserId, username: testUsername },
                wrongSecret,
                { issuer: "watch-party", audience: "watch-party-users" },
            );

            expect(() => verifyToken(token)).toThrow("Invalid token");
        });

        it("should throw for token with wrong issuer", () => {
            const secret = process.env.JWT_SECRET as string;
            const token = jwt.sign(
                { userId: testUserId, username: testUsername },
                secret,
                { issuer: "wrong-issuer", audience: "watch-party-users" },
            );

            expect(() => verifyToken(token)).toThrow("Invalid token");
        });

        it("should throw for token with wrong audience", () => {
            const secret = process.env.JWT_SECRET as string;
            const token = jwt.sign(
                { userId: testUserId, username: testUsername },
                secret,
                { issuer: "watch-party", audience: "wrong-audience" },
            );

            expect(() => verifyToken(token)).toThrow("Invalid token");
        });

        it("should throw for expired token", () => {
            const secret = process.env.JWT_SECRET as string;
            const expiredToken = jwt.sign(
                { userId: testUserId, username: testUsername, exp: Math.floor(Date.now() / 1000) - 3600 },
                secret,
                { issuer: "watch-party", audience: "watch-party-users" },
            );

            expect(() => verifyToken(expiredToken)).toThrow("Token has expired");
        });
    });

    describe("decodeToken", () => {
        it("should decode a valid token without verification", () => {
            const token = generateToken(testUserId, testUsername);
            const payload = decodeToken(token);

            expect(payload).not.toBeNull();
            expect(payload?.userId).toBe(testUserId);
            expect(payload?.username).toBe(testUsername);
        });

        it("should return null for invalid token", () => {
            const payload = decodeToken("invalid-token");

            expect(payload).toBeNull();
        });

        it("should decode expired token (since it doesn't verify)", () => {
            const secret = process.env.JWT_SECRET as string;
            const expiredToken = jwt.sign(
                { userId: testUserId, username: testUsername, exp: Math.floor(Date.now() / 1000) - 3600 },
                secret,
                { issuer: "watch-party", audience: "watch-party-users" },
            );

            const payload = decodeToken(expiredToken);

            expect(payload).not.toBeNull();
            expect(payload?.userId).toBe(testUserId);
        });
    });

    describe("refreshToken", () => {
        it("should generate a new token with same payload", () => {
            const originalToken = generateToken(testUserId, testUsername);
            const refreshedToken = refreshToken(originalToken);

            expect(typeof refreshedToken).toBe("string");
            // Note: JWTs with identical payloads are identical, so tokens may be the same

            const refreshedPayload = verifyToken(refreshedToken);
            expect(refreshedPayload.userId).toBe(testUserId);
            expect(refreshedPayload.username).toBe(testUsername);
        });

        it("should throw for invalid original token", () => {
            expect(() => refreshToken("invalid-token")).toThrow();
        });
    });

    describe("extractTokenFromHeader", () => {
        it("should extract token from Bearer header", () => {
            const token = "abc123token";
            const header = `Bearer ${token}`;

            expect(extractTokenFromHeader(header)).toBe(token);
        });

        it("should extract token from header without Bearer prefix", () => {
            const token = "abc123token";
            const header = token;

            expect(extractTokenFromHeader(header)).toBe(token);
        });

        it("should return null for null/undefined header", () => {
            expect(extractTokenFromHeader(null)).toBeNull();
            expect(extractTokenFromHeader(undefined as any)).toBeNull();
        });

        it("should handle edge cases correctly", () => {
            // "Bearer" with no token returns "Bearer" (single part)
            expect(extractTokenFromHeader("Bearer")).toBe("Bearer");
            // "Bearer token extra" returns null (more than 2 parts)
            expect(extractTokenFromHeader("Bearer token extra")).toBeNull();
            // Empty string returns null
            expect(extractTokenFromHeader("")).toBeNull();
        });

        it("should return null for malformed Bearer headers with extra spaces", () => {
            const token = "abc123token";
            const header = `Bearer   ${token}   `;

            // This creates more than 2 parts when split by space, so returns null
            expect(extractTokenFromHeader(header)).toBeNull();
        });
    });
});
