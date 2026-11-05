/**
 * DuckAI Provider
 * 
 * Main module for the DuckAI provider implementation.
 * Exports the client, models, and challenge solving functionality.
 * 
 * @module providers/duckai
 */

export { DuckAIClient, DuckAIError, BASE, MAX_RETRIES, DEFAULT_UA } from './client.js';
export { solveChallenge, buildProof } from './challenge.js';
export {
  MODEL_ALIASES,
  DEFAULT_MODEL,
  SERVED_MODELS,
  resolveModel,
  getModels,
  isModelSupported
} from './models.js';
