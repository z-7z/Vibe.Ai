/**
 * OpenRouter Provider
 * 
 * @module providers/openrouter
 */

export { OpenRouterClient, OpenRouterError, BASE_URL, DEFAULT_MODEL } from './client.js';
export {
  OPENROUTER_PROVIDERS,
  POPULAR_MODELS,
  MODEL_ALIASES,
  resolveModel,
  getModels,
  getPopularModels,
  getAllModelIds,
  isModelSupported
} from './models.js';
