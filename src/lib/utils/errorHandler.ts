/**
 * Centralized Error Handling
 * Addresses Medium Severity Issue #13: Error Handling Improvements
 * 
 * Provides consistent error handling with:
 * - Detailed server-side logging
 * - Generic client responses (security best practice)
 * - Type-safe error handling
 * - Easy integration with API routes
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  VALIDATION_ERROR = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export class AppError extends Error {
  constructor(
    public statusCode: ErrorCode,
    public message: string,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// Predefined Error Classes
// ============================================================================

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ErrorCode.NOT_FOUND, `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(ErrorCode.FORBIDDEN, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(ErrorCode.TOO_MANY_REQUESTS, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message);
  }
}

// ============================================================================
// Generic Error Messages (for clients)
// ============================================================================

const GENERIC_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Resource not found',
  409: 'Conflict',
  422: 'Validation failed',
  429: 'Too many requests',
  500: 'Internal server error',
  503: 'Service unavailable',
};

/**
 * Gets a generic error message for a status code
 */
function getGenericErrorMessage(statusCode: number): string {
  return GENERIC_ERROR_MESSAGES[statusCode] || 'An error occurred';
}

// ============================================================================
// Error Response Builder
// ============================================================================

interface ErrorResponse {
  error: string;
  statusCode?: number;
  details?: any;
}

/**
 * Builds a safe error response for clients
 */
function buildErrorResponse(
  statusCode: number,
  message: string,
  includeDetails: boolean = false,
  details?: any
): ErrorResponse {
  const response: ErrorResponse = {
    error: message,
  };
  
  // In development, include more details
  if (process.env.NODE_ENV !== 'production' && includeDetails && details) {
    response.details = details;
    response.statusCode = statusCode;
  }
  
  return response;
}

// ============================================================================
// Main Error Handler
// ============================================================================

/**
 * Handles errors and returns appropriate NextResponse
 * 
 * Features:
 * - Logs detailed error server-side
 * - Returns generic message to client (security)
 * - Differentiates between operational and programming errors
 */
export function handleError(
  error: unknown,
  context?: string
): NextResponse {
  // Log the error server-side with context
  const logContext = context ? `[${context}]` : '';
  
  // Handle AppError instances
  if (error instanceof AppError) {
    logger.error(
      `${logContext} Operational error:`,
      {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack,
      }
    );
    
    // Return appropriate response
    const message = error.isOperational 
      ? error.message 
      : getGenericErrorMessage(error.statusCode);
    
    return NextResponse.json(
      buildErrorResponse(
        error.statusCode,
        message,
        error.isOperational,
        error.details
      ),
      { status: error.statusCode }
    );
  }
  
  // Handle standard Error instances
  if (error instanceof Error) {
    logger.error(
      `${logContext} Unexpected error:`,
      {
        message: error.message,
        name: error.name,
        stack: error.stack,
      }
    );
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        buildErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed'
        ),
        { status: ErrorCode.VALIDATION_ERROR }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        buildErrorResponse(
          ErrorCode.NOT_FOUND,
          'Resource not found'
        ),
        { status: ErrorCode.NOT_FOUND }
      );
    }
    
    // Default to internal server error
    return NextResponse.json(
      buildErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        getGenericErrorMessage(ErrorCode.INTERNAL_ERROR)
      ),
      { status: ErrorCode.INTERNAL_ERROR }
    );
  }
  
  // Handle unknown error types
  logger.error(
    `${logContext} Unknown error type:`,
    error
  );
  
  return NextResponse.json(
    buildErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      getGenericErrorMessage(ErrorCode.INTERNAL_ERROR)
    ),
    { status: ErrorCode.INTERNAL_ERROR }
  );
}

// ============================================================================
// Error Handler Wrapper
// ============================================================================

/**
 * Wraps an API route handler with error handling
 * 
 * Usage:
 * export const POST = withErrorHandler(async (request) => {
 *   // Your handler code
 * }, 'POST /api/rooms');
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error, context);
    }
  };
}

// ============================================================================
// Async Error Catcher
// ============================================================================

/**
 * Wraps an async function to catch and handle errors
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    if (errorMessage) {
      logger.error(errorMessage, error);
    }
    return [null, error as Error];
  }
}

// ============================================================================
// Validation Error Helpers
// ============================================================================

/**
 * Throws a validation error with field details
 */
export function throwValidationError(
  field: string,
  message: string,
  value?: any
): never {
  throw new ValidationError(
    `Validation failed for field "${field}": ${message}`,
    { field, value }
  );
}

/**
 * Validates a condition and throws if false
 */
export function assertValid(
  condition: boolean,
  field: string,
  message: string
): asserts condition {
  if (!condition) {
    throwValidationError(field, message);
  }
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Checks if an error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Logs an error without throwing
 */
export function logError(error: unknown, context?: string): void {
  const logContext = context ? `[${context}]` : '';
  logger.error(`${logContext} Error logged:`, error);
}

/**
 * Creates a safe error message for logging
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Using withErrorHandler wrapper
 * 
 * export const POST = withErrorHandler(async (request: NextRequest) => {
 *   const body = await request.json();
 *   
 *   if (!body.name) {
 *     throw new ValidationError('Name is required');
 *   }
 *   
 *   const room = await createRoom(body);
 *   return NextResponse.json(room, { status: 201 });
 * }, 'POST /api/rooms');
 * 
 * 
 * Example 2: Using try-catch with handleError
 * 
 * export async function POST(request: NextRequest) {
 *   try {
 *     const body = await request.json();
 *     
 *     if (!body.id) {
 *       throw new ValidationError('ID is required');
 *     }
 *     
 *     const result = await someOperation(body.id);
 *     return NextResponse.json(result);
 *   } catch (error) {
 *     return handleError(error, 'POST /api/example');
 *   }
 * }
 * 
 * 
 * Example 3: Using tryCatch for safer async operations
 * 
 * const [room, error] = await tryCatch(
 *   () => roomManager.getRoom(roomId),
 *   'Failed to get room'
 * );
 * 
 * if (error || !room) {
 *   throw new NotFoundError('Room');
 * }
 */
