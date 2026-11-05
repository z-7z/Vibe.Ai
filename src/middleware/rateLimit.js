/**
 * Rate Limiting Middleware
 * 
 * Simple in-memory rate limiting for Vibe.Ai API
 * 
 * @module middleware/rateLimit
 */

import { RATE_LIMIT, RATE_LIMIT_WINDOW } from '../config.js';

// Store request counts per IP address
const requestCounts = new Map();

/**
 * Rate limiting middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function rateLimiter(req, res, next) {
  // Skip rate limiting for health checks
  if (req.path === '/health' || req.path === '/healthz') {
    return next();
  }

  const ip = getClientIP(req);
  const now = Date.now();

  // Initialize or clean up old entries for this IP
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip);

  // Remove timestamps older than the window
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  requestCounts.set(ip, recentTimestamps);

  // Check if rate limit is exceeded
  if (recentTimestamps.length >= RATE_LIMIT) {
    const oldest = recentTimestamps[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - oldest)) / 1000);
    
    res.set('Retry-After', String(retryAfter));
    res.set('X-RateLimit-Limit', String(RATE_LIMIT));
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', String(Math.floor((oldest + RATE_LIMIT_WINDOW) / 1000)));
    
    return res.status(429).json({
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
        code: 429
      }
    });
  }

  // Add current request timestamp
  recentTimestamps.push(now);
  requestCounts.set(ip, recentTimestamps);

  // Set rate limit headers
  res.set('X-RateLimit-Limit', String(RATE_LIMIT));
  res.set('X-RateLimit-Remaining', String(RATE_LIMIT - recentTimestamps.length));
  res.set('X-RateLimit-Reset', String(Math.floor((recentTimestamps[0] + RATE_LIMIT_WINDOW) / 1000)));

  next();
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For and X-Real-IP headers for reverse proxy setups
 * 
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  // Check for forwarded headers (reverse proxy)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0) {
      return ips[0];
    }
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  // Fall back to connection remote address
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
}

/**
 * Clean up old rate limit entries periodically
 * Prevents memory leaks from storing timestamps indefinitely
 * 
 * @param {number} [interval=300000] - Cleanup interval in ms (default: 5 minutes)
 */
export function startRateLimitCleanup(interval = 300000) {
  setInterval(() => {
    const now = Date.now();
    
    for (const [ip, timestamps] of requestCounts.entries()) {
      // Remove old timestamps
      const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
      
      if (recent.length === 0) {
        // Remove IP if no recent requests
        requestCounts.delete(ip);
      } else {
        requestCounts.set(ip, recent);
      }
    }
  }, interval);
}

/**
 * Get current request count for an IP
 * Useful for testing and monitoring
 * 
 * @param {string} ip - IP address
 * @returns {number} Current request count
 */
export function getRequestCount(ip) {
  const timestamps = requestCounts.get(ip) || [];
  const now = Date.now();
  return timestamps.filter(t => now - t < RATE_LIMIT_WINDOW).length;
}

/**
 * Reset rate limiting for testing
 */
export function resetRateLimits() {
  requestCounts.clear();
}

export default rateLimiter;
