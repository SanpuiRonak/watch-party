import { describe, expect, it } from "vitest";
import { validateAndTruncateUsername } from "@/lib/utils/serverValidation";

describe("Server Validation Utils", () => {
    describe("validateAndTruncateUsername", () => {
        it("should return the username if it's valid and under 50 characters", () => {
            const result = validateAndTruncateUsername("JohnDoe");
            expect(result).toBe("JohnDoe");
        });

        it("should trim whitespace from the username", () => {
            const result = validateAndTruncateUsername("  JohnDoe  ");
            expect(result).toBe("JohnDoe");
        });

        it("should truncate usernames longer than 50 characters", () => {
            const longUsername = "A".repeat(60);
            const result = validateAndTruncateUsername(longUsername);
            expect(result).toBe("A".repeat(50));
            expect(result.length).toBe(50);
        });

        it("should return 'Anonymous' for null input", () => {
            const result = validateAndTruncateUsername(null as any);
            expect(result).toBe("Anonymous");
        });

        it("should return 'Anonymous' for undefined input", () => {
            const result = validateAndTruncateUsername(undefined as any);
            expect(result).toBe("Anonymous");
        });

        it("should return 'Anonymous' for non-string input", () => {
            const result = validateAndTruncateUsername(123 as any);
            expect(result).toBe("Anonymous");
        });

        it("should return 'Anonymous' for empty string", () => {
            const result = validateAndTruncateUsername("");
            expect(result).toBe("Anonymous");
        });

        it("should return 'Anonymous' for whitespace-only string", () => {
            const result = validateAndTruncateUsername("   ");
            expect(result).toBe("Anonymous");
        });

        it("should handle usernames at exactly 50 characters", () => {
            const fiftyCharUsername = "A".repeat(50);
            const result = validateAndTruncateUsername(fiftyCharUsername);
            expect(result).toBe("A".repeat(50));
            expect(result.length).toBe(50);
        });

        it("should handle usernames with special characters", () => {
            const result = validateAndTruncateUsername("User@Example_123!");
            expect(result).toBe("User@Example_123!");
        });

        it("should handle usernames with unicode characters", () => {
            const result = validateAndTruncateUsername("用户🚀");
            expect(result).toBe("用户🚀");
        });

        it("should handle edge case of trimming and truncating", () => {
            const input = `  ${"A".repeat(60)}  `;
            const result = validateAndTruncateUsername(input);
            expect(result).toBe("A".repeat(50));
            expect(result.length).toBe(50);
        });
    });
});
