import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import {
    AppError,
    assertValid,
    ConflictError,
    ErrorCode,
    ForbiddenError,
    getSafeErrorMessage,
    handleError,
    isOperationalError,
    logError,
    NotFoundError,
    RateLimitError,
    throwValidationError,
    tryCatch,
    UnauthorizedError,
    ValidationError,
    withErrorHandler,
} from "@/lib/utils/errorHandler";
import { logger } from "@/lib/utils/logger";

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
    logger: {
        error: vi.fn(),
    },
}));

describe("Error Handler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("ErrorCode enum", () => {
        it("should have correct status codes", () => {
            expect(ErrorCode.BAD_REQUEST).toBe(400);
            expect(ErrorCode.UNAUTHORIZED).toBe(401);
            expect(ErrorCode.FORBIDDEN).toBe(403);
            expect(ErrorCode.NOT_FOUND).toBe(404);
            expect(ErrorCode.CONFLICT).toBe(409);
            expect(ErrorCode.VALIDATION_ERROR).toBe(422);
            expect(ErrorCode.TOO_MANY_REQUESTS).toBe(429);
            expect(ErrorCode.INTERNAL_ERROR).toBe(500);
            expect(ErrorCode.SERVICE_UNAVAILABLE).toBe(503);
        });
    });

    describe("AppError class", () => {
        it("should create error with correct properties", () => {
            const error = new AppError(ErrorCode.BAD_REQUEST, "Test error", { field: "test" });

            expect(error.statusCode).toBe(400);
            expect(error.message).toBe("Test error");
            expect(error.details).toEqual({ field: "test" });
            expect(error.isOperational).toBe(true);
            expect(error.name).toBe("AppError");
        });

        it("should capture stack trace", () => {
            const error = new AppError(ErrorCode.INTERNAL_ERROR, "Test error");
            expect(error.stack).toBeDefined();
        });
    });

    describe("Predefined error classes", () => {
        it("should create ValidationError", () => {
            const error = new ValidationError("Invalid input", { field: "email" });
            expect(error.statusCode).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.message).toBe("Invalid input");
            expect(error.details).toEqual({ field: "email" });
        });

        it("should create NotFoundError", () => {
            const error = new NotFoundError("User");
            expect(error.statusCode).toBe(ErrorCode.NOT_FOUND);
            expect(error.message).toBe("User not found");
        });

        it("should create NotFoundError with default resource", () => {
            const error = new NotFoundError();
            expect(error.message).toBe("Resource not found");
        });

        it("should create UnauthorizedError", () => {
            const error = new UnauthorizedError("Invalid token");
            expect(error.statusCode).toBe(ErrorCode.UNAUTHORIZED);
            expect(error.message).toBe("Invalid token");
        });

        it("should create UnauthorizedError with default message", () => {
            const error = new UnauthorizedError();
            expect(error.message).toBe("Unauthorized");
        });

        it("should create ForbiddenError", () => {
            const error = new ForbiddenError("Access denied");
            expect(error.statusCode).toBe(ErrorCode.FORBIDDEN);
            expect(error.message).toBe("Access denied");
        });

        it("should create ForbiddenError with default message", () => {
            const error = new ForbiddenError();
            expect(error.message).toBe("Forbidden");
        });

        it("should create RateLimitError", () => {
            const error = new RateLimitError("Rate limit exceeded");
            expect(error.statusCode).toBe(ErrorCode.TOO_MANY_REQUESTS);
            expect(error.message).toBe("Rate limit exceeded");
        });

        it("should create RateLimitError with default message", () => {
            const error = new RateLimitError();
            expect(error.message).toBe("Too many requests");
        });

        it("should create ConflictError", () => {
            const error = new ConflictError("Resource already exists");
            expect(error.statusCode).toBe(ErrorCode.CONFLICT);
            expect(error.message).toBe("Resource already exists");
        });
    });

    describe("handleError function", () => {
        it("should handle AppError instances", () => {
            const appError = new ValidationError("Invalid data", { field: "email" });
            const response = handleError(appError, "Test context");

            expect(response.status).toBe(422);
            expect(response).toBeInstanceOf(NextResponse);
        });

        it("should handle operational AppError with generic message in production", () => {
            // Mock process.env for this test
            const originalEnv = process.env.NODE_ENV;
            vi.stubEnv("NODE_ENV", "production");

            const appError = new AppError(ErrorCode.INTERNAL_ERROR, "Secret error", undefined, false);
            const response = handleError(appError);

            expect(response.status).toBe(500);
            expect(response).toBeInstanceOf(NextResponse);

            vi.unstubAllEnvs();
            // Restore original env if it existed
            if (originalEnv !== undefined) {
                vi.stubEnv("NODE_ENV", originalEnv);
            }
        });

        it("should include details in development for operational errors", () => {
            // Mock process.env for this test
            const originalEnv = process.env.NODE_ENV;
            vi.stubEnv("NODE_ENV", "development");

            const appError = new ValidationError("Test error", { field: "test" });
            const response = handleError(appError);

            expect(response.status).toBe(422);
            expect(response).toBeInstanceOf(NextResponse);

            vi.unstubAllEnvs();
            // Restore original env if it existed
            if (originalEnv !== undefined) {
                vi.stubEnv("NODE_ENV", originalEnv);
            }
        });

        it("should handle standard Error instances", () => {
            const error = new Error("Something went wrong");
            const response = handleError(error, "API handler");

            expect(response.status).toBe(500);
            expect(response).toBeInstanceOf(NextResponse);
        });

        it("should handle ValidationError named errors", () => {
            const error = new Error("Validation failed");
            error.name = "ValidationError";

            const response = handleError(error);

            expect(response.status).toBe(422);
            expect(response).toBeInstanceOf(NextResponse);
        });

        it("should handle not found errors in message", () => {
            const error = new Error("User not found");

            const response = handleError(error);

            expect(response.status).toBe(404);
            expect(response).toBeInstanceOf(NextResponse);
        });

        it("should handle unknown error types", () => {
            const error = "String error";
            const response = handleError(error);

            expect(response.status).toBe(500);
            expect(response).toBeInstanceOf(NextResponse);
        });

        it("should include context in logging", () => {
            const error = new Error("Test error");
            handleError(error, "POST /api/test");

            expect(vi.mocked(logger).error).toHaveBeenCalledWith(
                "[POST /api/test] Unexpected error:",
                expect.objectContaining({
                    message: "Test error",
                    name: "Error",
                }),
            );
        });
    });

    describe("withErrorHandler wrapper", () => {
        it("should call handler successfully", async() => {
            const mockHandler = vi.fn().mockResolvedValue(
                NextResponse.json({ success: true }),
            );

            const wrappedHandler = withErrorHandler(mockHandler);
            const result = await wrappedHandler("arg1", "arg2");

            expect(mockHandler).toHaveBeenCalledWith("arg1", "arg2");
            expect(result).toBeInstanceOf(NextResponse);
        });

        it("should handle errors thrown by handler", async() => {
            const mockHandler = vi.fn().mockRejectedValue(
                new ValidationError("Handler error"),
            );

            const wrappedHandler = withErrorHandler(mockHandler, "Test handler");
            const result = await wrappedHandler();

            expect(result.status).toBe(422);
            expect(result).toBeInstanceOf(NextResponse);
        });

        it("should preserve handler arguments", async() => {
            const mockHandler = vi.fn().mockImplementation((_req: any, _context: any) => {
                throw new Error("Test error");
            });

            const wrappedHandler = withErrorHandler(mockHandler);
            await wrappedHandler("request", "context");

            expect(mockHandler).toHaveBeenCalledWith("request", "context");
        });
    });

    describe("tryCatch function", () => {
        it("should return result on success", async() => {
            const asyncFn = vi.fn().mockResolvedValue("success");

            const [result, error] = await tryCatch(asyncFn);

            expect(result).toBe("success");
            expect(error).toBeNull();
        });

        it("should return error on failure", async() => {
            const testError = new Error("Test failure");
            const asyncFn = vi.fn().mockRejectedValue(testError);

            const [result, error] = await tryCatch(asyncFn, "Custom error message");

            expect(result).toBeNull();
            expect(error).toBe(testError);

            expect(vi.mocked(logger).error).toHaveBeenCalledWith("Custom error message", testError);
        });

        it("should not log if no error message provided", async() => {
            const testError = new Error("Silent failure");
            const asyncFn = vi.fn().mockRejectedValue(testError);

            const [result, error] = await tryCatch(asyncFn);

            expect(result).toBeNull();
            expect(error).toBe(testError);

            expect(vi.mocked(logger).error).not.toHaveBeenCalled();
        });
    });

    describe("Validation helpers", () => {
        describe("throwValidationError", () => {
            it("should throw ValidationError with field details", () => {
                expect(() => {
                    throwValidationError("email", "Invalid email format", "test@");
                }).toThrow(ValidationError);

                try {
                    throwValidationError("email", "Invalid email format", "test@");
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationError);
                    expect(error.statusCode).toBe(ErrorCode.VALIDATION_ERROR);
                    expect(error.message).toBe('Validation failed for field "email": Invalid email format');
                    expect(error.details).toEqual({
                        field: "email",
                        value: "test@",
                    });
                }
            });
        });

        describe("assertValid", () => {
            it("should not throw for truthy conditions", () => {
                expect(() => {
                    assertValid(true, "test", "Should not throw");
                }).not.toThrow();
            });

            it("should throw for falsy conditions", () => {
                expect(() => {
                    assertValid(false, "email", "Email is required");
                }).toThrow(ValidationError);

                try {
                    assertValid(false, "email", "Email is required");
                } catch (error) {
                    expect(error.message).toBe('Validation failed for field "email": Email is required');
                    expect(error.details).toEqual({
                        field: "email",
                        value: undefined,
                    });
                }
            });
        });
    });

    describe("Error utilities", () => {
        describe("isOperationalError", () => {
            it("should return true for AppError instances", () => {
                const operationalError = new ValidationError("Test");
                const programmingError = new AppError(500, "Test", undefined, false);

                expect(isOperationalError(operationalError)).toBe(true);
                expect(isOperationalError(programmingError)).toBe(false);
            });

            it("should return false for standard errors", () => {
                const error = new Error("Standard error");
                expect(isOperationalError(error)).toBe(false);
            });
        });

        describe("logError", () => {
            it("should log error with context", () => {
                const error = new Error("Test log error");
                logError(error, "Test context");

                expect(vi.mocked(logger).error).toHaveBeenCalledWith("[Test context] Error logged:", error);
            });

            it("should log error without context", () => {
                const error = "String error";
                logError(error);

                expect(vi.mocked(logger).error).toHaveBeenCalledWith(" Error logged:", error);
            });
        });

        describe("getSafeErrorMessage", () => {
            it("should return message for Error instances", () => {
                const error = new Error("Safe message");
                expect(getSafeErrorMessage(error)).toBe("Safe message");
            });

            it("should return string errors as-is", () => {
                expect(getSafeErrorMessage("String error")).toBe("String error");
            });

            it("should return default message for unknown errors", () => {
                expect(getSafeErrorMessage({ unknown: "error" })).toBe("Unknown error");
                expect(getSafeErrorMessage(null)).toBe("Unknown error");
                expect(getSafeErrorMessage(undefined)).toBe("Unknown error");
            });
        });
    });
});
