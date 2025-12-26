import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateStreamUrl } from "@/lib/utils/validation";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock secure logger
vi.mock("@/lib/utils/security", () => ({
    secureLogger: {
        error: vi.fn(),
    },
}));

describe("Validation Utils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("validateStreamUrl", () => {
        it("should validate a valid HTTPS video URL", async() => {
            const mockResponse = {
                ok: true,
                url: "https://example.com/video.mp4",
                headers: {
                    get: vi.fn().mockReturnValue("video/mp4"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/video.mp4");

            expect(result.isValid).toBe(true);
            expect(result.finalUrl).toBe("https://example.com/video.mp4");
            expect(mockFetch).toHaveBeenCalledWith("https://example.com/video.mp4", expect.any(Object));
        });

        it("should validate URLs with video file extensions", async() => {
            const mockResponse = {
                ok: true,
                url: "https://example.com/stream.m3u8",
                headers: {
                    get: vi.fn().mockReturnValue("application/octet-stream"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/stream.m3u8");

            expect(result.isValid).toBe(true);
            expect(result.finalUrl).toBe("https://example.com/stream.m3u8");
        });

        it("should reject invalid protocols", async() => {
            const result = await validateStreamUrl("ftp://example.com/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should reject blacklisted hosts", async() => {
            const result = await validateStreamUrl("https://localhost/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should reject private IPv4 addresses", async() => {
            const result = await validateStreamUrl("https://192.168.1.1/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should reject private IPv6 addresses", async() => {
            const result = await validateStreamUrl("https://[::1]/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should reject 10.0.0.0/8 range", async() => {
            const result = await validateStreamUrl("https://10.5.5.5/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should reject 172.16.0.0/12 range", async() => {
            const result = await validateStreamUrl("https://172.20.10.5/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should handle HTTP URLs", async() => {
            const mockResponse = {
                ok: true,
                url: "http://example.com/video.mp4",
                headers: {
                    get: vi.fn().mockReturnValue("video/mp4"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("http://example.com/video.mp4");

            expect(result.isValid).toBe(true);
            expect(result.finalUrl).toBe("http://example.com/video.mp4");
        });

        it("should handle redirects safely", async() => {
            const mockResponse = {
                ok: true,
                url: "https://final-example.com/video.mp4", // Redirected URL
                headers: {
                    get: vi.fn().mockReturnValue("video/mp4"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/redirect");

            expect(result.isValid).toBe(true);
            expect(result.finalUrl).toBe("https://final-example.com/video.mp4");
        });

        it("should reject redirects to blacklisted hosts", async() => {
            const mockResponse = {
                ok: true,
                url: "https://localhost/malicious.mp4", // Redirected to blacklisted host
                headers: {
                    get: vi.fn().mockReturnValue("video/mp4"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/redirect");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
        });

        it("should handle fetch timeouts", async() => {
            // Mock fetch to simulate a timeout by rejecting immediately with AbortError
            mockFetch.mockRejectedValue(new Error("The operation was aborted"));

            const result = await validateStreamUrl("https://example.com/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
        });

        it("should handle network errors", async() => {
            mockFetch.mockRejectedValue(new Error("Network error"));

            const result = await validateStreamUrl("https://example.com/video.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
        });

        it("should reject non-video content types", async() => {
            const mockResponse = {
                ok: true,
                url: "https://example.com/file.txt",
                headers: {
                    get: vi.fn().mockReturnValue("text/plain"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/file.txt");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
        });

        it("should accept HLS streams", async() => {
            const mockResponse = {
                ok: true,
                url: "https://example.com/stream.m3u8",
                headers: {
                    get: vi.fn().mockReturnValue("application/x-mpegURL"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/stream.m3u8");

            expect(result.isValid).toBe(true);
            expect(result.finalUrl).toBe("https://example.com/stream.m3u8");
        });

        it("should handle URLs without content-type headers but with valid extensions", async() => {
            const mockResponse = {
                ok: true,
                url: "https://example.com/video.webm",
                headers: {
                    get: vi.fn().mockReturnValue(null),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/video.webm");

            expect(result.isValid).toBe(true);
            expect(result.finalUrl).toBe("https://example.com/video.webm");
        });

        it("should handle malformed URLs", async() => {
            const result = await validateStreamUrl("not-a-url");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should reject unsuccessful HTTP responses", async() => {
            const mockResponse = {
                ok: false,
                status: 404,
                url: "https://example.com/notfound.mp4",
                headers: {
                    get: vi.fn().mockReturnValue("video/mp4"),
                },
            };

            mockFetch.mockResolvedValue(mockResponse);

            const result = await validateStreamUrl("https://example.com/notfound.mp4");

            expect(result.isValid).toBe(false);
            expect(result.finalUrl).toBeUndefined();
        });
    });
});
