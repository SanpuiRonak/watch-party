/**
 * Enhanced Logging System
 * Addresses Medium Severity Issue #10: Proper Logging Strategy
 * 
 * Provides structured logging with:
 * - Environment-based log levels
 * - Sensitive data redaction
 * - Consistent formatting
 * - Easy integration throughout the app
 */

// ============================================================================
// Log Levels
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// ============================================================================
// Configuration
// ============================================================================

const LOG_CONFIG = {
  // Set log level based on environment
  currentLevel: process.env.NODE_ENV === 'production' 
    ? LogLevel.INFO 
    : LogLevel.DEBUG,
  
  // Enable/disable timestamps
  includeTimestamp: true,
  
  // Enable/disable sensitive data redaction
  redactSensitiveData: process.env.NODE_ENV === 'production',
  
  // Colors for console output (development only)
  colors: {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',  // Reset
  },
} as const;

// ============================================================================
// Sensitive Data Redaction
// ============================================================================

/**
 * Patterns to detect and redact sensitive data
 */
const SENSITIVE_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // JWT tokens (looks for common JWT format)
  jwt: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
  
  // UUIDs (partially redact)
  uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  
  // API keys (common patterns)
  apiKey: /\b(api[_-]?key|apikey|api[_-]?secret)["\s:=]+[A-Za-z0-9_-]{20,}\b/gi,
  
  // Passwords (in common formats)
  password: /\b(password|passwd|pwd)["\s:=]+[^\s,}]+/gi,
};

/**
 * Redacts sensitive data from a string
 */
function redactSensitiveData(text: string): string {
  if (!LOG_CONFIG.redactSensitiveData) {
    return text;
  }
  
  let redacted = text;
  
  // Redact emails
  redacted = redacted.replace(SENSITIVE_PATTERNS.email, '[EMAIL_REDACTED]');
  
  // Redact JWT tokens
  redacted = redacted.replace(SENSITIVE_PATTERNS.jwt, '[TOKEN_REDACTED]');
  
  // Partially redact UUIDs (show first 8 chars)
  redacted = redacted.replace(SENSITIVE_PATTERNS.uuid, (match) => {
    return match.substring(0, 8) + '***';
  });
  
  // Redact API keys
  redacted = redacted.replace(SENSITIVE_PATTERNS.apiKey, '$1=[REDACTED]');
  
  // Redact passwords
  redacted = redacted.replace(SENSITIVE_PATTERNS.password, '$1=[REDACTED]');
  
  return redacted;
}

/**
 * Sanitizes objects for logging (handles circular references and functions)
 */
function sanitizeForLogging(obj: any, depth: number = 0, maxDepth: number = 5): any {
  if (depth > maxDepth) {
    return '[Max Depth Reached]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'function') {
    return '[Function]';
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, depth + 1, maxDepth));
  }
  
  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Redact sensitive keys
      if (/password|token|secret|key|auth/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(obj[key], depth + 1, maxDepth);
      }
    }
  }
  
  return sanitized;
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Formats a log message with timestamp and level
 */
function formatLogMessage(level: string, message: string): string {
  const timestamp = LOG_CONFIG.includeTimestamp 
    ? new Date().toISOString() 
    : '';
  
  const parts = [
    timestamp,
    `[${level}]`,
    message,
  ].filter(Boolean);
  
  return parts.join(' ');
}

/**
 * Converts arguments to a loggable string
 */
function argsToString(args: any[]): string {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return redactSensitiveData(arg);
    }
    
    if (typeof arg === 'object') {
      try {
        const sanitized = sanitizeForLogging(arg);
        const json = JSON.stringify(sanitized, null, 2);
        return redactSensitiveData(json);
      } catch (error) {
        return '[Object with circular reference]';
      }
    }
    
    return String(arg);
  }).join(' ');
}

// ============================================================================
// Logger Class
// ============================================================================

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return level >= LOG_CONFIG.currentLevel;
  }
  
  private colorize(text: string, level: string): string {
    if (process.env.NODE_ENV === 'production') {
      return text;
    }
    
    const color = LOG_CONFIG.colors[level as keyof typeof LOG_CONFIG.colors] || '';
    const reset = LOG_CONFIG.colors.reset;
    return `${color}${text}${reset}`;
  }
  
  /**
   * Debug level logging (only in development)
   */
  debug(...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const message = formatLogMessage('DEBUG', argsToString(args));
    console.log(this.colorize(message, 'debug'));
  }
  
  /**
   * Info level logging
   */
  info(...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const message = formatLogMessage('INFO', argsToString(args));
    console.log(this.colorize(message, 'info'));
  }
  
  /**
   * Warning level logging
   */
  warn(...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const message = formatLogMessage('WARN', argsToString(args));
    console.warn(this.colorize(message, 'warn'));
  }
  
  /**
   * Error level logging
   */
  error(...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const message = formatLogMessage('ERROR', argsToString(args));
    console.error(this.colorize(message, 'error'));
  }
  
  /**
   * Log user action with automatic ID redaction
   */
  userAction(action: string, userId: string, details?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const redactedId = userId.substring(0, 8) + '***';
    const message = details
      ? `User ${redactedId} ${action}: ${JSON.stringify(sanitizeForLogging(details))}`
      : `User ${redactedId} ${action}`;
    
    this.info(message);
  }
  
  /**
   * Log room action with automatic ID redaction
   */
  roomAction(action: string, roomId: string, userId?: string, details?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const redactedRoomId = roomId.substring(0, 8) + '***';
    const redactedUserId = userId ? userId.substring(0, 8) + '***' : null;
    
    let message = `Room ${redactedRoomId} ${action}`;
    if (redactedUserId) {
      message += ` by user ${redactedUserId}`;
    }
    if (details) {
      message += `: ${JSON.stringify(sanitizeForLogging(details))}`;
    }
    
    this.info(message);
  }
  
  /**
   * Log API request
   */
  apiRequest(method: string, path: string, statusCode?: number, duration?: number): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    let message = `${method} ${path}`;
    if (statusCode) {
      message += ` -> ${statusCode}`;
    }
    if (duration) {
      message += ` (${duration}ms)`;
    }
    
    this.info(message);
  }
  
  /**
   * Log authentication event
   */
  authEvent(event: 'login' | 'logout' | 'token_refresh' | 'auth_failed', userId?: string, reason?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const redactedId = userId ? userId.substring(0, 8) + '***' : 'anonymous';
    let message = `Auth: ${event} for user ${redactedId}`;
    
    if (reason) {
      message += ` - ${reason}`;
    }
    
    if (event === 'auth_failed') {
      this.warn(message);
    } else {
      this.info(message);
    }
  }
  
  /**
   * Log rate limit event
   */
  rateLimitEvent(identifier: string, action: string, blocked: boolean): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const status = blocked ? 'BLOCKED' : 'allowed';
    const message = `Rate limit ${status}: ${action} for ${identifier}`;
    
    if (blocked) {
      this.warn(message);
    } else {
      this.debug(message);
    }
  }
  
  /**
   * Log security event (always logged regardless of level)
   */
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any): void {
    const message = `[SECURITY ${severity.toUpperCase()}] ${event}`;
    
    if (details) {
      this.error(message, sanitizeForLogging(details));
    } else {
      this.error(message);
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const logger = new Logger();

// Also export as default
export default logger;

// ============================================================================
// Utility: Replace console.log throughout the app
// ============================================================================

/**
 * Example usage:
 * 
 * // Basic logging
 * logger.debug('Detailed debug info', { data: 'value' });
 * logger.info('General information');
 * logger.warn('Warning message');
 * logger.error('Error occurred', error);
 * 
 * // Specialized logging
 * logger.userAction('created room', userId, { roomName: 'My Room' });
 * logger.roomAction('updated permissions', roomId, userId);
 * logger.apiRequest('POST', '/api/rooms', 201, 45);
 * logger.authEvent('login', userId);
 * logger.rateLimitEvent('192.168.1.1', 'create_room', true);
 * logger.securityEvent('XSS attempt detected', 'high', { input: '<script>' });
 */
