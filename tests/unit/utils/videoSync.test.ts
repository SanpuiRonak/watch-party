import { beforeEach, describe, expect, it, vi } from "vitest";
import { VideoState } from "@/lib/types";
import { getCurrentTime } from "@/lib/utils/videoSync";

describe("Video Sync Utilities", () => {
    describe("getCurrentTime", () => {
        beforeEach(() => {
            // Reset Date.now mock before each test
            vi.useRealTimers();
        });

        it("should return currentTime when video is not playing", () => {
            const videoState: VideoState = {
                currentTime: 120,
                lastUpdated: Date.now(),
                isPlaying: false,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(120);
        });

        it("should return currentTime when video is paused", () => {
            const videoState: VideoState = {
                currentTime: 300,
                lastUpdated: Date.now() - 5000, // 5 seconds ago
                isPlaying: false,
                playbackRate: 1.5,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(300);
        });

        it("should calculate elapsed time when video is playing", () => {
            // Mock Date.now to return a consistent time
            const mockNow = 1000000000; // Some timestamp
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 100,
                lastUpdated: mockNow - 2000, // 2 seconds ago
                isPlaying: true,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(102); // 100 + 2 seconds
        });

        it("should calculate elapsed time with playback rate", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 50,
                lastUpdated: mockNow - 3000, // 3 seconds ago
                isPlaying: true,
                playbackRate: 2,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(56); // 50 + (3 * 2) seconds
        });

        it("should handle fractional playback rates", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 10,
                lastUpdated: mockNow - 4000, // 4 seconds ago
                isPlaying: true,
                playbackRate: 0.5,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(12); // 10 + (4 * 0.5) seconds
        });

        it("should handle fast forward playback rates", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 0,
                lastUpdated: mockNow - 1000, // 1 second ago
                isPlaying: true,
                playbackRate: 4,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(4); // 0 + (1 * 4) seconds
        });

        it("should handle zero elapsed time", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 75,
                lastUpdated: mockNow, // Just updated
                isPlaying: true,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(75); // No time has elapsed
        });

        it("should handle very small elapsed time", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 60,
                lastUpdated: mockNow - 100, // 0.1 seconds ago
                isPlaying: true,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(60.1); // 60 + 0.1 seconds
        });

        it("should handle large elapsed time", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 0,
                lastUpdated: mockNow - 3600000, // 1 hour ago
                isPlaying: true,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(3600); // 0 + 3600 seconds (1 hour)
        });

        it("should handle zero currentTime", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 0,
                lastUpdated: mockNow - 5000,
                isPlaying: true,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(5);
        });

        it("should handle negative currentTime edge case", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: -10, // Unusual but possible
                lastUpdated: mockNow - 2000,
                isPlaying: true,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(-8); // -10 + 2 seconds
        });

        it("should handle playbackRate of 1", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 45,
                lastUpdated: mockNow - 15000, // 15 seconds ago
                isPlaying: true,
                playbackRate: 1,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(60); // 45 + 15 seconds
        });

        it("should handle playbackRate of 0.25 (slow motion)", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 20,
                lastUpdated: mockNow - 8000, // 8 seconds ago
                isPlaying: true,
                playbackRate: 0.25,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(22); // 20 + (8 * 0.25) seconds
        });

        it("should handle playbackRate of 3 (3x speed)", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 10,
                lastUpdated: mockNow - 10000, // 10 seconds ago
                isPlaying: true,
                playbackRate: 3,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(40); // 10 + (10 * 3) seconds
        });

        it("should return precise floating point results", () => {
            const mockNow = 1000000000;
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);

            const videoState: VideoState = {
                currentTime: 12.5,
                lastUpdated: mockNow - 3500, // 3.5 seconds ago
                isPlaying: true,
                playbackRate: 1.5,
            };

            const result = getCurrentTime(videoState);
            expect(result).toBe(17.75); // 12.5 + (3.5 * 1.5) seconds
        });
    });
});
