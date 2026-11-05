/**
 * Mistral AI Models Configuration
 * 
 * @module providers/mistral/models
 */

/**
 * Mistral AI available models
 * These are the main models offered by Mistral AI
 */
export const MISTRAL_MODELS = [
  'mistral-large-latest',
  'mistral-large-2407',
  'mistral-large-2402',
  'mistral-small-latest',
  'mistral-small-2407',
  'mistral-small-2402',
  'mistral-tiny-latest',
  'mistral-tiny-2402',
  'codestral-latest',
  'codestral-2405',
  'mistral-embed',
];

/**
 * Model aliases for Mistral AI
 */
export const MODEL_ALIASES = {
  'mistral-large': 'mistral-large-latest',
  'mistral-large-latest': 'mistral-large-latest',
  'mistral-large-2407': 'mistral-large-2407',
  'mistral-large-2402': 'mistral-large-2402',
  'mistral-small': 'mistral-small-latest',
  'mistral-small-latest': 'mistral-small-latest',
  'mistral-small-2407': 'mistral-small-2407',
  'mistral-small-2402': 'mistral-small-2402',
  'mistral-tiny': 'mistral-tiny-latest',
  'mistral-tiny-latest': 'mistral-tiny-latest',
  'mistral-tiny-2402': 'mistral-tiny-2402',
  'codestral': 'codestral-latest',
  'codestral-latest': 'codestral-latest',
  'codestral-2405': 'codestral-2405',
};

/**
 * Default Mistral model
 */
export const DEFAULT_MODEL = 'mistral-large-latest';

/**
 * Resolve a Mistral model name to its canonical ID
 * 
 * @param {string} name - Model name or alias
 * @returns {string} Canonical model ID
 */
export function resolveModel(name) {
  if (!name) {
    return DEFAULT_MODEL;
  }
  
  const normalizedName = name.trim().toLowerCase();
  
  if (MISTRAL_MODELS.includes(normalizedName)) {
    return normalizedName;
  }
  
  if (MODEL_ALIASES[normalizedName]) {
    return MODEL_ALIASES[normalizedName];
  }
  
  // Return as-is if it looks like a valid model ID
  if (normalizedName.startsWith('mistral-') || normalizedName.startsWith('codestral-')) {
    return name;
  }
  
  return DEFAULT_MODEL;
}

/**
 * Get list of available Mistral models in OpenAI format
 * 
 * @returns {Array<Object>} List of model objects
 */
export function getModels() {
  const now = Math.floor(Date.now() / 1000);
  
  return MISTRAL_MODELS.map(model => ({
    id: model,
    object: 'model',
    created: now,
    owned_by: 'mistral.ai',
    provider: 'mistral'
  }));
}

/**
 * Check if a model is supported by Mistral
 * 
 * @param {string} model - Model ID to check
 * @returns {boolean} True if the model is supported
 */
export function isModelSupported(model) {
  if (!model) return false;
  
  const resolved = resolveModel(model);
  return MISTRAL_MODELS.includes(resolved);
}
