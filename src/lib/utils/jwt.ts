import jwt from 'jsonwebtoken';

// Get JWT secret from environment or use a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'development-secret-change-in-production') {
  console.error('WARNING: Using default JWT secret in production! Set JWT_SECRET environment variable.');
}

// NOTE: JWT tokens do not expire for anonymous users
// This is intentional because anonymous users cannot re-authenticate (no passwords)
// If tokens expired, users would be permanently locked out of their accounts

export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user (no expiration for anonymous users)
 */
export function generateToken(userId: string, username: string): string {
  try {
    const payload: JWTPayload = {
      userId,
      username,
    };

    return jwt.sign(payload, JWT_SECRET, {
      issuer: 'watch-party',
      audience: 'watch-party-users',
    } as jwt.SignOptions);
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'watch-party',
      audience: 'watch-party-users',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      console.error('Error verifying JWT token:', error);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Decode a JWT token without verification (use only for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Refresh a token (generate new one with same payload but fresh expiry)
 */
export function refreshToken(oldToken: string): string {
  const decoded = verifyToken(oldToken);
  return generateToken(decoded.userId, decoded.username);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return null;
}
