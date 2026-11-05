/**
 * Error Utilities
 * 
 * Standard error handling for Vibe.Ai API
 * 
 * @module utils/errors
 */

/**
 * Create a standardized API error response
 * 
 * @param {string} message - Error message
 * @param {string} [type='invalid_request_error'] - Error type
 * @param {number} [status=400] - HTTP status code
 * @param {Object} [details] - Additional error details
 * @returns {Object} Error response object
 */
export function createError(message, type = 'invalid_request_error', status = 400, details = null) {
  const error = {
    error: {
      message,
      type,
      code: status
    }
  };

  if (details) {
    error.error.details = details;
  }

  return error;
}

/**
 * Create a validation error response
 * 
 * @param {string} message - Error message
 * @param {Object} [details] - Validation details
 * @returns {Object} Error response object
 */
export function createValidationError(message, details = null) {
  return createError(message, 'validation_error', 400, details);
}

/**
 * Create an authentication error response
 * 
 * @param {string} message - Error message
 * @returns {Object} Error response object
 */
export function createAuthError(message = 'Missing or invalid API key') {
  return createError(message, 'authentication_error', 401);
}

/**
 * Create a rate limit error response
 * 
 * @param {string} message - Error message
 * @returns {Object} Error response object
 */
export function createRateLimitError(message = 'Rate limit exceeded') {
  return createError(message, 'rate_limit_error', 429);
}

/**
 * Create a not found error response
 * 
 * @param {string} message - Error message
 * @returns {Object} Error response object
 */
export function createNotFoundError(message = 'Not found') {
  return createError(message, 'not_found_error', 404);
}

/**
 * Create an upstream error response
 * 
 * @param {string} message - Error message
 * @param {number} [status=502] - HTTP status code
 * @returns {Object} Error response object
 */
export function createUpstreamError(message, status = 502) {
  return createError(message, 'upstream_error', status);
}

/**
 * Create a server error response
 * 
 * @param {string} message - Error message
 * @returns {Object} Error response object
 */
export function createServerError(message = 'Internal server error') {
  return createError(message, 'server_error', 500);
}

/**
 * Map DuckAI error status codes to appropriate HTTP status codes
 * 
 * @param {number} status - DuckAI status code
 * @returns {number} HTTP status code
 */
export function mapDuckAIStatus(status) {
  switch (status) {
    case 418:
      return 429; // I'm a teapot -> Too Many Requests (rate limit)
    case 400:
      return 400; // Bad Request
    case 401:
      return 401; // Unauthorized
    case 403:
      return 403; // Forbidden
    case 404:
      return 404; // Not Found
    case 429:
      return 429; // Too Many Requests
    case 500:
    case 502:
    case 503:
    case 504:
      return 502; // Bad Gateway for upstream errors
    default:
      return 502; // Default to Bad Gateway
  }
}

/**
 * Create an error from a DuckAI error
 * 
 * @param {Error} error - The original error
 * @returns {Object} Error response object
 */
export function fromDuckAIError(error) {
  const status = error.status ? mapDuckAIStatus(error.status) : 502;
  return createError(error.message, 'upstream_error', status);
}
