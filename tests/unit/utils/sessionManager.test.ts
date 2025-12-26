import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearOldLocalStorageSession,
    createSession,
    destroySession,
    destroySessionCookie,
    getCurrentUserId,
    getCurrentUsername,
    getSession,
    getSessionFromRequest,
    getUserIdFromRequest,
    hasValidSession,
    hasValidSessionInRequest,
    refreshSession,
    refreshSessionCookie,
    requireSession,
    requireSessionFromRequest,
    setSessionCookie,
    shouldMigrateFromLocalStorage,
} from "@/lib/utils/sessionManager";
// Type import will be combined with function imports below

// Mock Next.js cookies
const mockCookies = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
};

vi.mock("next/headers", () => ({
    cookies: vi.fn(() => Promise.resolve(mockCookies)),
}));

// Mock Next.js request/response
vi.mock("next/server", () => ({
    NextRequest: vi.fn(),
    NextResponse: vi.fn(),
}));

// Mock JWT functions
vi.mock("@/lib/utils/jwt", () => ({
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
    logger: {
        authEvent: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

// Import mocked modules
import { cookies } from "next/headers";
import { generateToken, type JWTPayload, verifyToken } from "@/lib/utils/jwt";
import { logger } from "@/lib/utils/logger";

describe("Session Manager", () => {
    const mockUserId = "user123";
    const mockUsername = "testuser";
    const mockToken = "mock-jwt-token";
    const mockPayload: JWTPayload = {
        userId: mockUserId,
        username: mockUsername,
        iat: Date.now(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset cookie mocks
        mockCookies.get.mockReset();
        mockCookies.set.mockReset();
        mockCookies.delete.mockReset();

        // Setup default mocks
        (cookies as any).mockResolvedValue(mockCookies);
        (generateToken as any).mockReturnValue(mockToken);
        (verifyToken as any).mockReturnValue(mockPayload);
    });

    describe("createSession", () => {
        it("should create session with correct cookie options", async() => {
            await createSession(mockUserId, mockUsername);

            expect(generateToken).toHaveBeenCalledWith(mockUserId, mockUsername);
            expect(mockCookies.set).toHaveBeenCalledWith("watch-party-session", mockToken, {
                httpOnly: true,
                secure: false, // test environment
                sameSite: "strict",
                path: "/",
            });
            expect(logger.authEvent).toHaveBeenCalledWith("login", mockUserId);
        });

        it("should create secure cookie in production", async() => {
            // Mock NODE_ENV for production
            const originalEnv = process.env.NODE_ENV;
            Object.defineProperty(process.env, "NODE_ENV", {
                value: "production",
                writable: true,
            });

            await createSession(mockUserId, mockUsername);

            expect(mockCookies.set).toHaveBeenCalledWith("watch-party-session", mockToken, {
                httpOnly: true,
                secure: true, // production environment
                sameSite: "strict",
                path: "/",
            });

            // Restore original NODE_ENV
            Object.defineProperty(process.env, "NODE_ENV", {
                value: originalEnv,
                writable: true,
            });
        });

        it("should handle cookie store promise resolution", async() => {
            const customMockCookies = { ...mockCookies };
            (cookies as any).mockResolvedValueOnce(customMockCookies);

            await createSession(mockUserId, mockUsername);

            expect(customMockCookies.set).toHaveBeenCalledWith("watch-party-session", mockToken, expect.any(Object));
        });
    });

    describe("setSessionCookie", () => {
        it("should set session cookie in response", () => {
            const mockResponse = {
                cookies: {
                    set: vi.fn(),
                },
            } as any;

            const result = setSessionCookie(mockResponse, mockUserId, mockUsername);

            expect(generateToken).toHaveBeenCalledWith(mockUserId, mockUsername);
            expect(mockResponse.cookies.set).toHaveBeenCalledWith("watch-party-session", mockToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                path: "/",
            });
            expect(logger.authEvent).toHaveBeenCalledWith("login", mockUserId);
            expect(result).toBe(mockResponse);
        });

        it("should return the same response object", () => {
            const mockResponse = { cookies: { set: vi.fn() } } as any;

            const result = setSessionCookie(mockResponse, mockUserId, mockUsername);

            expect(result).toBe(mockResponse);
        });
    });

    describe("getSession", () => {
        it("should return session payload when cookie exists", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });

            const result = await getSession();

            expect(mockCookies.get).toHaveBeenCalledWith("watch-party-session");
            expect(verifyToken).toHaveBeenCalledWith(mockToken);
            expect(result).toBe(mockPayload);
        });

        it("should return null when no cookie exists", async() => {
            mockCookies.get.mockReturnValue(undefined);

            const result = await getSession();

            expect(result).toBeNull();
            expect(verifyToken).not.toHaveBeenCalled();
        });

        it("should return null when token verification fails", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });
            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const result = await getSession();

            expect(result).toBeNull();
            expect(logger.authEvent).toHaveBeenCalledWith("auth_failed", undefined, "Invalid session token");
        });

        it("should handle cookie store promise resolution", async() => {
            const customMockCookies = { ...mockCookies, get: vi.fn().mockReturnValue({ value: mockToken }) };
            (cookies as any).mockResolvedValueOnce(customMockCookies);

            const result = await getSession();

            expect(result).toBe(mockPayload);
        });
    });

    describe("getSessionFromRequest", () => {
        it("should return session from request cookies", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            const result = getSessionFromRequest(mockRequest);

            expect(mockRequest.cookies.get).toHaveBeenCalledWith("watch-party-session");
            expect(verifyToken).toHaveBeenCalledWith(mockToken);
            expect(result).toBe(mockPayload);
        });

        it("should return null when request has no session cookie", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue(undefined),
                },
            } as any;

            const result = getSessionFromRequest(mockRequest);

            expect(result).toBeNull();
            expect(verifyToken).not.toHaveBeenCalled();
        });

        it("should return null when token verification fails", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const result = getSessionFromRequest(mockRequest);

            expect(result).toBeNull();
            expect(logger.authEvent).toHaveBeenCalledWith("auth_failed", undefined, "Invalid session token");
        });
    });

    describe("requireSession", () => {
        it("should return session when valid session exists", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });

            const result = await requireSession();

            expect(result).toBe(mockPayload);
        });

        it("should throw error when no session exists", async() => {
            mockCookies.get.mockReturnValue(undefined);

            await expect(requireSession()).rejects.toThrow("Authentication required");
        });

        it("should throw error when token verification fails", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });
            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            await expect(requireSession()).rejects.toThrow("Authentication required");
        });
    });

    describe("requireSessionFromRequest", () => {
        it("should return session from request when valid", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            const result = requireSessionFromRequest(mockRequest);

            expect(result).toBe(mockPayload);
        });

        it("should throw error when request has no session", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue(undefined),
                },
            } as any;

            expect(() => requireSessionFromRequest(mockRequest)).toThrow("Authentication required");
        });

        it("should throw error when token verification fails", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            expect(() => requireSessionFromRequest(mockRequest)).toThrow("Authentication required");
        });
    });

    describe("destroySession", () => {
        it("should delete session cookie", async() => {
            await destroySession(mockUserId);

            expect(mockCookies.delete).toHaveBeenCalledWith("watch-party-session");
            expect(logger.authEvent).toHaveBeenCalledWith("logout", mockUserId);
        });

        it("should not log when no userId provided", async() => {
            await destroySession();

            expect(mockCookies.delete).toHaveBeenCalledWith("watch-party-session");
            expect(logger.authEvent).not.toHaveBeenCalled();
        });

        it("should handle cookie store promise resolution", async() => {
            const customMockCookies = { ...mockCookies, delete: vi.fn() };
            (cookies as any).mockResolvedValueOnce(customMockCookies);

            await destroySession();

            expect(customMockCookies.delete).toHaveBeenCalledWith("watch-party-session");
        });
    });

    describe("destroySessionCookie", () => {
        it("should delete session cookie from response", () => {
            const mockResponse = {
                cookies: {
                    delete: vi.fn(),
                },
            } as any;

            const result = destroySessionCookie(mockResponse);

            expect(mockResponse.cookies.delete).toHaveBeenCalledWith("watch-party-session");
            expect(result).toBe(mockResponse);
        });

        it("should return the same response object", () => {
            const mockResponse = { cookies: { delete: vi.fn() } } as any;

            const result = destroySessionCookie(mockResponse);

            expect(result).toBe(mockResponse);
        });
    });

    describe("hasValidSession", () => {
        it("should return true when session exists", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });

            const result = await hasValidSession();

            expect(result).toBe(true);
        });

        it("should return false when no session exists", async() => {
            mockCookies.get.mockReturnValue(undefined);

            const result = await hasValidSession();

            expect(result).toBe(false);
        });

        it("should return false when token verification fails", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });
            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const result = await hasValidSession();

            expect(result).toBe(false);
        });
    });

    describe("hasValidSessionInRequest", () => {
        it("should return true when request has valid session", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            const result = hasValidSessionInRequest(mockRequest);

            expect(result).toBe(true);
        });

        it("should return false when request has no session", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue(undefined),
                },
            } as any;

            const result = hasValidSessionInRequest(mockRequest);

            expect(result).toBe(false);
        });

        it("should return false when token verification fails", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const result = hasValidSessionInRequest(mockRequest);

            expect(result).toBe(false);
        });
    });

    describe("refreshSession", () => {
        it("should refresh existing session", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });

            await refreshSession();

            expect(mockCookies.get).toHaveBeenCalledWith("watch-party-session");
            expect(generateToken).toHaveBeenCalledWith(mockUserId, mockUsername);
            expect(mockCookies.set).toHaveBeenCalledWith("watch-party-session", mockToken, expect.any(Object));
            expect(logger.authEvent).toHaveBeenCalledWith("token_refresh", mockUserId);
        });

        it("should throw error when no session exists", async() => {
            mockCookies.get.mockReturnValue(undefined);

            await expect(refreshSession()).rejects.toThrow("No session to refresh");
        });

        it("should throw error when token verification fails", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });
            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            await expect(refreshSession()).rejects.toThrow("No session to refresh");
        });
    });

    describe("refreshSessionCookie", () => {
        it("should refresh session in response", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            const mockResponse = {
                cookies: {
                    set: vi.fn(),
                },
            } as any;

            const result = refreshSessionCookie(mockResponse, mockRequest);

            expect(mockRequest.cookies.get).toHaveBeenCalledWith("watch-party-session");
            expect(generateToken).toHaveBeenCalledWith(mockUserId, mockUsername);
            expect(mockResponse.cookies.set).toHaveBeenCalledWith("watch-party-session", mockToken, expect.any(Object));
            expect(result).toBe(mockResponse);
        });

        it("should return response unchanged when no session exists", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue(undefined),
                },
            } as any;

            const mockResponse = { cookies: { set: vi.fn() } } as any;

            const result = refreshSessionCookie(mockResponse, mockRequest);

            expect(mockResponse.cookies.set).not.toHaveBeenCalled();
            expect(result).toBe(mockResponse);
        });
    });

    describe("getCurrentUserId", () => {
        it("should return user ID when session exists", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });

            const result = await getCurrentUserId();

            expect(result).toBe(mockUserId);
        });

        it("should return null when no session exists", async() => {
            mockCookies.get.mockReturnValue(undefined);

            const result = await getCurrentUserId();

            expect(result).toBeNull();
        });

        it("should return null when token verification fails", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });
            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const result = await getCurrentUserId();

            expect(result).toBeNull();
        });
    });

    describe("getUserIdFromRequest", () => {
        it("should return user ID from request session", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            const result = getUserIdFromRequest(mockRequest);

            expect(result).toBe(mockUserId);
        });

        it("should return null when request has no session", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue(undefined),
                },
            } as any;

            const result = getUserIdFromRequest(mockRequest);

            expect(result).toBeNull();
        });

        it("should return null when token verification fails", () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: mockToken }),
                },
            } as any;

            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const result = getUserIdFromRequest(mockRequest);

            expect(result).toBeNull();
        });
    });

    describe("getCurrentUsername", () => {
        it("should return username when session exists", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });

            const result = await getCurrentUsername();

            expect(result).toBe(mockUsername);
        });

        it("should return null when no session exists", async() => {
            mockCookies.get.mockReturnValue(undefined);

            const result = await getCurrentUsername();

            expect(result).toBeNull();
        });

        it("should return null when token verification fails", async() => {
            mockCookies.get.mockReturnValue({ value: mockToken });
            (verifyToken as any).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const result = await getCurrentUsername();

            expect(result).toBeNull();
        });
    });

    describe("shouldMigrateFromLocalStorage", () => {
        it("should return false on server side", () => {
            const result = shouldMigrateFromLocalStorage();

            expect(result).toBe(false);
        });

        it("should return true when localStorage has old data", () => {
            // Mock window and localStorage before calling the function
            const mockLocalStorage = {
                getItem: vi.fn().mockReturnValue("old-user-data"),
            };

            // Define window in global scope
            Object.defineProperty(global, "window", {
                value: {
                    localStorage: mockLocalStorage,
                },
                writable: true,
                configurable: true,
            });

            const result = shouldMigrateFromLocalStorage();

            expect(result).toBe(true);
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("watch-party-user");

            // Cleanup
            delete (global as any).window;
        });

        it("should return false when localStorage has no old data", () => {
            const mockLocalStorage = {
                getItem: vi.fn().mockReturnValue(null),
            };

            Object.defineProperty(global, "window", {
                value: {
                    localStorage: mockLocalStorage,
                },
                writable: true,
                configurable: true,
            });

            const result = shouldMigrateFromLocalStorage();

            expect(result).toBe(false);

            // Cleanup
            delete (global as any).window;
        });

        it("should handle localStorage errors gracefully", () => {
            const mockLocalStorage = {
                getItem: vi.fn().mockImplementation(() => {
                    throw new Error("localStorage error");
                }),
            };

            Object.defineProperty(global, "window", {
                value: {
                    localStorage: mockLocalStorage,
                },
                writable: true,
                configurable: true,
            });

            const result = shouldMigrateFromLocalStorage();

            expect(result).toBe(false);

            // Cleanup
            delete (global as any).window;
        });
    });

    describe("clearOldLocalStorageSession", () => {
        it("should do nothing on server side", () => {
            expect(() => clearOldLocalStorageSession()).not.toThrow();
        });

        it("should clear old localStorage data", () => {
            const mockLocalStorage = {
                removeItem: vi.fn(),
            };

            Object.defineProperty(global, "window", {
                value: {
                    localStorage: mockLocalStorage,
                },
                writable: true,
                configurable: true,
            });

            clearOldLocalStorageSession();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("watch-party-user");
            expect(logger.info).toHaveBeenCalledWith("Cleared old localStorage session");

            // Cleanup
            delete (global as any).window;
        });

        it("should handle localStorage errors gracefully", () => {
            const mockLocalStorage = {
                removeItem: vi.fn().mockImplementation(() => {
                    throw new Error("localStorage error");
                }),
            };

            Object.defineProperty(global, "window", {
                value: {
                    localStorage: mockLocalStorage,
                },
                writable: true,
                configurable: true,
            });

            expect(() => clearOldLocalStorageSession()).not.toThrow();
            expect(logger.warn).toHaveBeenCalledWith("Failed to clear old localStorage session", expect.any(Error));

            // Cleanup
            delete (global as any).window;
        });
    });
});
