import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearUser, generateUsername, loadUser, saveUser } from "@/lib/utils/userStorage";
import type { User } from "@/lib/types";

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
});

describe("User Storage", () => {
    const mockUser: User = {
        id: "user123",
        username: "testuser",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();

        // Reset localStorage mocks
        mockLocalStorage.getItem.mockReset();
        mockLocalStorage.setItem.mockReset();
        mockLocalStorage.removeItem.mockReset();

        // Reset Math.random for consistent username generation
        vi.spyOn(Math, "random").mockRestore();
    });

    describe("saveUser", () => {
        it("should save user to localStorage", () => {
            saveUser(mockUser);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                "watch-party-user",
                JSON.stringify(mockUser),
            );
        });

        it("should handle user with special characters", () => {
            const specialUser: User = {
                id: "user-123",
                username: "test@user",
            };

            saveUser(specialUser);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                "watch-party-user",
                JSON.stringify(specialUser),
            );
        });

        it("should handle empty username", () => {
            const emptyUsernameUser: User = {
                id: "user123",
                username: "",
            };

            saveUser(emptyUsernameUser);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                "watch-party-user",
                JSON.stringify(emptyUsernameUser),
            );
        });
    });

    describe("loadUser", () => {
        it("should return user when data exists in localStorage", () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

            const result = loadUser();

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("watch-party-user");
            expect(result).toEqual(mockUser);
        });

        it("should return null when no data exists in localStorage", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = loadUser();

            expect(result).toBeNull();
        });

        it("should return null when localStorage returns empty string", () => {
            mockLocalStorage.getItem.mockReturnValue("");

            const result = loadUser();

            expect(result).toBeNull();
        });

        it("should handle malformed JSON gracefully", () => {
            mockLocalStorage.getItem.mockReturnValue("invalid-json");

            const result = loadUser();

            expect(result).toBeNull();
        });

        it("should handle incomplete JSON objects", () => {
            mockLocalStorage.getItem.mockReturnValue('{"id": "user123"}'); // missing username

            const result = loadUser();

            expect(result).toBeNull();
        });

        it("should handle localStorage errors gracefully", () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error("localStorage error");
            });

            const result = loadUser();

            expect(result).toBeNull();
        });

        it("should parse valid JSON correctly", () => {
            const jsonString = '{"id":"user456","username":"anotheruser"}';
            mockLocalStorage.getItem.mockReturnValue(jsonString);

            const result = loadUser();

            expect(result).toEqual({
                id: "user456",
                username: "anotheruser",
            });
        });
    });

    describe("clearUser", () => {
        it("should remove user from localStorage", () => {
            clearUser();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("watch-party-user");
        });

        it("should handle localStorage errors gracefully", () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error("localStorage error");
            });

            expect(() => clearUser()).not.toThrow();
        });
    });

    describe("generateUsername", () => {
        it("should generate a username with adjective, noun, and number", () => {
            // Mock Math.random for predictable results
            const originalRandom = Math.random;
            Math.random = vi.fn()
                .mockReturnValueOnce(0) // adjective index 0: "Cool"
                .mockReturnValueOnce(0) // noun index 0: "Panda"
                .mockReturnValueOnce(0.5); // number: 50

            const result = generateUsername();

            expect(result).toBe("CoolPanda50");

            // Restore original Math.random
            Math.random = originalRandom;
        });

        it("should generate different usernames on multiple calls", () => {
            const results = new Set();

            // Generate multiple usernames
            for (let i = 0; i < 10; i++) {
                results.add(generateUsername());
            }

            // Should generate some variety (though not guaranteed with small sample)
            expect(results.size).toBeGreaterThan(1);
        });

        it("should limit username length to 50 characters", () => {
            // Mock to get maximum length combination
            const originalRandom = Math.random;
            Math.random = vi.fn()
                .mockReturnValueOnce(0.999) // last adjective: "Bold" (4 chars)
                .mockReturnValueOnce(0.999) // last noun: "Fox" (3 chars)
                .mockReturnValueOnce(0.99); // number: 99

            const result = generateUsername();

            expect(result.length).toBeLessThanOrEqual(50);
            expect(result).toBe("BoldFox99");

            Math.random = originalRandom;
        });

        it("should generate valid usernames within expected ranges", () => {
            const adjectives = ["Cool", "Happy", "Swift", "Bright", "Clever", "Bold"];
            const nouns = ["Panda", "Tiger", "Eagle", "Shark", "Wolf", "Fox"];

            // Test multiple generations
            for (let i = 0; i < 20; i++) {
                const username = generateUsername();

                // Should contain an adjective
                const hasAdjective = adjectives.some(adj => username.startsWith(adj));
                expect(hasAdjective).toBe(true);

                // Should contain a noun
                const hasNoun = nouns.some(noun => username.includes(noun));
                expect(hasNoun).toBe(true);

                // Should end with a number
                const endsWithNumber = /\d+$/.test(username);
                expect(endsWithNumber).toBe(true);

                // Should be non-empty
                expect(username.length).toBeGreaterThan(0);
            }
        });

        it("should handle edge case random values", () => {
            // Test with random returning exactly 0
            const originalRandom = Math.random;
            Math.random = vi.fn()
                .mockReturnValueOnce(0) // first index
                .mockReturnValueOnce(0) // first index
                .mockReturnValueOnce(0); // number: 0

            const result = generateUsername();
            expect(result).toBe("CoolPanda0");

            Math.random = originalRandom;
        });

        it("should handle edge case random values near 1", () => {
            // Test with random returning very close to 1
            const originalRandom = Math.random;
            Math.random = vi.fn()
                .mockReturnValueOnce(0.999999) // last valid index: "Bold"
                .mockReturnValueOnce(0.999999) // last valid index: "Fox"
                .mockReturnValueOnce(0.999999); // number: 99

            const result = generateUsername();
            expect(result).toBe("BoldFox99");

            Math.random = originalRandom;
        });
    });
});
