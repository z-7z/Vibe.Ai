/**
 * Vibe.Ai Configuration
 * 
 * Central configuration module using environment variables.
 * 
 * @module config
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Get an environment variable with a default value
 * 
 * @param {string} name - Environment variable name
 * @param {*} defaultValue - Default value if not set
 * @returns {*} The value or default
 */
function getEnv(name, defaultValue) {
  const value = process.env[name];
  return value !== undefined ? value : defaultValue;
}

/**
 * Get an environment variable as a number
 * 
 * @param {string} name - Environment variable name
 * @param {number} defaultValue - Default value if not set
 * @returns {number} The numeric value or default
 */
function getEnvNumber(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Get an environment variable as a boolean
 * 
 * @param {string} name - Environment variable name
 * @param {boolean} defaultValue - Default value if not set
 * @returns {boolean} The boolean value or default
 */
function getEnvBoolean(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Server configuration
export const PORT = getEnvNumber('PORT', 3000);
export const HOST = getEnv('HOST', '127.0.0.1');

// API authentication
export const API_KEY = getEnv('VIBE_API_KEY', '').trim();
export const REQUIRE_API_KEY = getEnvBoolean('VIBE_REQUIRE_API_KEY', false);

// Rate limiting
export const RATE_LIMIT = getEnvNumber('VIBE_RATE_LIMIT', 60); // requests per minute
export const RATE_LIMIT_WINDOW = getEnvNumber('VIBE_RATE_LIMIT_WINDOW', 60000); // ms

// Request configuration
export const MAX_PROMPT_CHARS = getEnvNumber('VIBE_MAX_PROMPT_CHARS', 15000);
export const REQUEST_TIMEOUT = getEnvNumber('VIBE_REQUEST_TIMEOUT', 180000); // 3 minutes

// Upstream configuration (DuckAI specific)
export const UPSTREAM_MAX_CONCURRENT = getEnvNumber('VIBE_UPSTREAM_MAX_CONCURRENT', 1);
export const UPSTREAM_RETRY_DELAY = getEnvNumber('VIBE_UPSTREAM_RETRY_DELAY', 2000);

// Provider configuration
export const DEFAULT_PROVIDER = getEnv('VIBE_DEFAULT_PROVIDER', 'duckai');

// Logging
export const LOG_LEVEL = getEnv('VIBE_LOG_LEVEL', 'info'); // debug, info, warn, error

// CORS
export const CORS_ORIGIN = getEnv('VIBE_CORS_ORIGIN', '*');

/**
 * Check if API key authentication is required
 * If VIBE_API_KEY is set and not empty, authentication is required
 * If VIBE_REQUIRE_API_KEY is explicitly set to true, authentication is required
 * Otherwise, public mode is enabled
 * 
 * @returns {boolean} True if API key is required
 */
export function isApiKeyRequired() {
  return REQUIRE_API_KEY || (API_KEY && API_KEY.length > 0);
}

/**
 * Get the complete configuration object
 * 
 * @returns {Object} All configuration values
 */
export function getConfig() {
  return {
    port: PORT,
    host: HOST,
    apiKey: API_KEY,
    requireApiKey: isApiKeyRequired(),
    rateLimit: RATE_LIMIT,
    rateLimitWindow: RATE_LIMIT_WINDOW,
    maxPromptChars: MAX_PROMPT_CHARS,
    requestTimeout: REQUEST_TIMEOUT,
    upstreamMaxConcurrent: UPSTREAM_MAX_CONCURRENT,
    upstreamRetryDelay: UPSTREAM_RETRY_DELAY,
    defaultProvider: DEFAULT_PROVIDER,
    logLevel: LOG_LEVEL,
    corsOrigin: CORS_ORIGIN
  };
}

/**
 * Validate configuration
 * 
 * @throws {Error} If configuration is invalid
 */
export function validateConfig() {
  if (PORT < 0 || PORT > 65535) {
    throw new Error(`Invalid PORT: ${PORT}. Must be between 0 and 65535.`);
  }

  if (MAX_PROMPT_CHARS <= 0) {
    throw new Error(`Invalid VIBE_MAX_PROMPT_CHARS: ${MAX_PROMPT_CHARS}. Must be positive.`);
  }

  if (RATE_LIMIT <= 0) {
    throw new Error(`Invalid VIBE_RATE_LIMIT: ${RATE_LIMIT}. Must be positive.`);
  }

  if (UPSTREAM_MAX_CONCURRENT <= 0) {
    throw new Error(`Invalid VIBE_UPSTREAM_MAX_CONCURRENT: ${UPSTREAM_MAX_CONCURRENT}. Must be positive.`);
  }
}

export default {
  getConfig,
  validateConfig,
  isApiKeyRequired
};
