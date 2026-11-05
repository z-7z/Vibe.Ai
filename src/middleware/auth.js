/**
 * Authentication Middleware
 * 
 * Optional API key authentication for Vibe.Ai
 * Supports both Bearer token and X-API-Key header
 * 
 * @module middleware/auth
 */

import { API_KEY, isApiKeyRequired } from '../config.js';
import { createAuthError } from '../utils/errors.js';

/**
 * Authentication middleware
 * Checks for valid API key if authentication is required
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function authMiddleware(req, res, next) {
  // Skip authentication if not required (public mode)
  if (!isApiKeyRequired()) {
    return next();
  }

  // Skip authentication for health checks
  if (req.path === '/health' || req.path === '/healthz') {
    return next();
  }

  // Extract API key from headers
  const authHeader = req.headers.authorization || '';
  const apiKeyHeader = req.headers['x-api-key'];

  let providedKey = null;

  // Check Bearer token
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    providedKey = authHeader.slice(7).trim();
  }

  // Check X-API-Key header
  if (apiKeyHeader) {
    providedKey = apiKeyHeader.trim();
  }

  // Validate the key
  if (!providedKey || !validateApiKey(providedKey)) {
    return res.status(401).json(createAuthError());
  }

  // Key is valid, proceed
  next();
}

/**
 * Validate an API key against the configured key
 * Uses constant-time comparison to prevent timing attacks
 * 
 * @param {string} providedKey - The key to validate
 * @returns {boolean} True if the key is valid
 */
function validateApiKey(providedKey) {
  if (!API_KEY || API_KEY.length === 0) {
    return false;
  }

  // Use constant-time comparison
  try {
    // Node.js crypto.timingSafeEqual requires buffers of equal length
    const providedBuffer = Buffer.from(providedKey, 'utf8');
    const expectedBuffer = Buffer.from(API_KEY, 'utf8');
    
    // Only compare if lengths match
    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (e) {
    // Fall back to simple comparison if timingSafeEqual fails
    // This is less secure but ensures functionality
    return providedKey === API_KEY;
  }
}

/**
 * Extract the API key from a request
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} The extracted API key or null
 */
export function extractApiKey(req) {
  const authHeader = req.headers.authorization || '';
  const apiKeyHeader = req.headers['x-api-key'];

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }

  return null;
}

/**
 * Check if a request is authenticated
 * 
 * @param {Object} req - Express request object
 * @returns {boolean} True if the request has a valid API key
 */
export function isAuthenticated(req) {
  if (!isApiKeyRequired()) {
    return true; // Public mode, always authenticated
  }

  const key = extractApiKey(req);
  return key !== null && validateApiKey(key);
}

export default authMiddleware;
