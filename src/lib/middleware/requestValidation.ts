/**
 * Request Validation Middleware
 * Addresses Medium Severity Issue #9: Request Size Limits
 * 
 * Provides validation for request body size, string lengths, and input formats
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Configuration Constants
// ============================================================================

export const VALIDATION_LIMITS = {
  // Body size limits (in bytes)
  MAX_JSON_SIZE: 1 * 1024 * 1024, // 1MB
  MAX_TEXT_SIZE: 500 * 1024, // 500KB
  
  // String length limits
  MAX_ROOM_NAME_LENGTH: 100,
  MAX_USERNAME_LENGTH: 50,
  MAX_STREAM_URL_LENGTH: 2000,
  MAX_USER_ID_LENGTH: 100,
  MAX_ROOM_ID_LENGTH: 100,
  
  // Array/object limits
  MAX_ARRAY_LENGTH: 100,
  MAX_OBJECT_KEYS: 50,
} as const;

// ============================================================================
// Length Validation Functions
// ============================================================================

/**
 * Validates that a string is within the specified length
 */
export function validateLength(
  value: string,
  fieldName: string,
  maxLength: number,
  minLength: number = 1
): void {
  if (value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }
}

/**
 * Validates room name length
 */
export function validateRoomNameLength(roomName: string): void {
  validateLength(
    roomName,
    'Room name',
    VALIDATION_LIMITS.MAX_ROOM_NAME_LENGTH
  );
}

/**
 * Validates username length
 */
export function validateUsernameLength(username: string): void {
  validateLength(
    username,
    'Username',
    VALIDATION_LIMITS.MAX_USERNAME_LENGTH
  );
}

/**
 * Validates stream URL length
 */
export function validateStreamUrlLength(streamUrl: string): void {
  validateLength(
    streamUrl,
    'Stream URL',
    VALIDATION_LIMITS.MAX_STREAM_URL_LENGTH
  );
}

/**
 * Validates user ID length
 */
export function validateUserIdLength(userId: string): void {
  validateLength(
    userId,
    'User ID',
    VALIDATION_LIMITS.MAX_USER_ID_LENGTH
  );
}

/**
 * Validates room ID length
 */
export function validateRoomIdLength(roomId: string): void {
  validateLength(
    roomId,
    'Room ID',
    VALIDATION_LIMITS.MAX_ROOM_ID_LENGTH
  );
}

// ============================================================================
// Request Body Size Validation
// ============================================================================

/**
 * Checks if request body size is within limits
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSize: number = VALIDATION_LIMITS.MAX_JSON_SIZE
): Promise<void> {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    
    if (size > maxSize) {
      throw new Error(
        `Request body too large. Maximum size is ${maxSize} bytes (${(maxSize / 1024).toFixed(0)}KB)`
      );
    }
  }
}

/**
 * Validates that JSON body doesn't exceed size limits
 */
export async function validateJsonBody<T = any>(
  request: NextRequest,
  maxSize: number = VALIDATION_LIMITS.MAX_JSON_SIZE
): Promise<T> {
  await validateRequestSize(request, maxSize);
  
  try {
    const body = await request.json();
    
    // Validate the parsed body doesn't have excessive data
    validateObjectComplexity(body);
    
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

// ============================================================================
// Object Complexity Validation
// ============================================================================

/**
 * Validates that an object doesn't have excessive nesting or keys
 * Prevents DoS attacks via deeply nested objects
 */
export function validateObjectComplexity(
  obj: any,
  maxDepth: number = 10,
  currentDepth: number = 0
): void {
  if (currentDepth > maxDepth) {
    throw new Error(`Object nesting too deep (max depth: ${maxDepth})`);
  }
  
  if (obj === null || obj === undefined) {
    return;
  }
  
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      if (obj.length > VALIDATION_LIMITS.MAX_ARRAY_LENGTH) {
        throw new Error(
          `Array too large (max ${VALIDATION_LIMITS.MAX_ARRAY_LENGTH} items)`
        );
      }
      
      for (const item of obj) {
        validateObjectComplexity(item, maxDepth, currentDepth + 1);
      }
    } else {
      const keys = Object.keys(obj);
      
      if (keys.length > VALIDATION_LIMITS.MAX_OBJECT_KEYS) {
        throw new Error(
          `Object has too many keys (max ${VALIDATION_LIMITS.MAX_OBJECT_KEYS})`
        );
      }
      
      for (const key of keys) {
        validateObjectComplexity(obj[key], maxDepth, currentDepth + 1);
      }
    }
  }
}

// ============================================================================
// Middleware Wrapper
// ============================================================================

/**
 * Creates a middleware wrapper that validates request size
 */
export function withRequestValidation(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    maxSize?: number;
    validateBody?: boolean;
  } = {}
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const maxSize = options.maxSize || VALIDATION_LIMITS.MAX_JSON_SIZE;
      
      // Validate request size if it has a body
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        await validateRequestSize(request, maxSize);
      }
      
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Request validation failed' },
        { status: 400 }
      );
    }
  };
}

// ============================================================================
// Complete Request Validation
// ============================================================================

/**
 * Validates a complete room creation request
 */
export function validateRoomCreationRequest(data: any): {
  roomName: string;
  streamUrl: string;
  ownerId: string;
  ownerName: string;
} {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { roomName, streamUrl, ownerId, ownerName } = data;
  
  // Check required fields
  if (!roomName || !streamUrl || !ownerId || !ownerName) {
    throw new Error('Missing required fields: roomName, streamUrl, ownerId, ownerName');
  }
  
  // Validate types
  if (typeof roomName !== 'string') {
    throw new Error('roomName must be a string');
  }
  if (typeof streamUrl !== 'string') {
    throw new Error('streamUrl must be a string');
  }
  if (typeof ownerId !== 'string') {
    throw new Error('ownerId must be a string');
  }
  if (typeof ownerName !== 'string') {
    throw new Error('ownerName must be a string');
  }
  
  // Validate lengths
  validateRoomNameLength(roomName);
  validateStreamUrlLength(streamUrl);
  validateUserIdLength(ownerId);
  validateUsernameLength(ownerName);
  
  return { roomName, streamUrl, ownerId, ownerName };
}

/**
 * Validates a permissions update request
 */
export function validatePermissionsRequest(data: any): {
  permissions: {
    canPlay: boolean;
    canSeek: boolean;
    canChangeSpeed: boolean;
  };
  ownerId: string;
} {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { permissions, ownerId } = data;
  
  if (!permissions || !ownerId) {
    throw new Error('Missing required fields: permissions, ownerId');
  }
  
  if (typeof ownerId !== 'string') {
    throw new Error('ownerId must be a string');
  }
  
  validateUserIdLength(ownerId);
  
  if (typeof permissions !== 'object') {
    throw new Error('permissions must be an object');
  }
  
  const { canPlay, canSeek, canChangeSpeed } = permissions;
  
  if (typeof canPlay !== 'boolean') {
    throw new Error('permissions.canPlay must be a boolean');
  }
  if (typeof canSeek !== 'boolean') {
    throw new Error('permissions.canSeek must be a boolean');
  }
  if (typeof canChangeSpeed !== 'boolean') {
    throw new Error('permissions.canChangeSpeed must be a boolean');
  }
  
  return {
    permissions: { canPlay, canSeek, canChangeSpeed },
    ownerId
  };
}
