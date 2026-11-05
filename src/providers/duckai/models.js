/**
 * DuckAI Models Configuration
 * 
 * Defines the available models and their configurations for DuckAI provider.
 * 
 * @module providers/duckai/models
 */

/**
 * Model aliases mapping short names to full model IDs
 */
export const MODEL_ALIASES = {
  'luna': 'gpt-6-luna',
  'gpt-6-luna': 'gpt-6-luna',
  'gpt-5.6-luna': 'gpt-5.6-luna',
  'nano': 'gpt-5.4-nano',
  'gpt-5.4-nano': 'gpt-5.4-nano',
  'mini': 'gpt-5.4-mini',
  'gpt-5.4-mini': 'gpt-5.4-mini',
  'haiku': 'claude-haiku-4-5',
  'claude-haiku-4-5': 'claude-haiku-4-5',
  'mistral': 'mistral-small-2603',
  'mistral-small-2603': 'mistral-small-2603',
};

/**
 * Default model to use when none is specified
 */
export const DEFAULT_MODEL = 'gpt-6-luna';

/**
 * List of models that are served by the DuckAI provider
 * These are the verified working models from the original DuckAI project
 */
export const SERVED_MODELS = [
  'gpt-6-luna',
  'gpt-5.6-luna',
  'gpt-5.4-nano',
  'gpt-5.4-mini',
  'claude-haiku-4-5',
  'mistral-small-2603'
];

/**
 * Resolves a model name to its canonical ID.
 * Accepts model aliases, full IDs, or returns the default.
 * 
 * @param {string} name - Model name or alias
 * @returns {string} Canonical model ID
 */
export function resolveModel(name) {
  if (!name) {
    return DEFAULT_MODEL;
  }
  
  const normalizedName = name.trim().toLowerCase();
  
  // Check if it's a direct match
  if (SERVED_MODELS.includes(normalizedName)) {
    return normalizedName;
  }
  
  // Check aliases
  if (MODEL_ALIASES[normalizedName]) {
    return MODEL_ALIASES[normalizedName];
  }
  
  // Return as-is if it looks like a valid model ID
  if (normalizedName.includes('-') || SERVED_MODELS.includes(name)) {
    return name;
  }
  
  // Fall back to default
  return DEFAULT_MODEL;
}

/**
 * Gets the list of available models in OpenAI format
 * 
 * @returns {Array<Object>} List of model objects with id, object type, and metadata
 */
export function getModels() {
  const now = Math.floor(Date.now() / 1000);
  
  return SERVED_MODELS.map(model => ({
    id: model,
    object: 'model',
    created: now,
    owned_by: 'duck.ai',
    provider: 'duckai'
  }));
}

/**
 * Checks if a model is supported by DuckAI
 * 
 * @param {string} model - Model ID to check
 * @returns {boolean} True if the model is supported
 */
export function isModelSupported(model) {
  if (!model) return false;
  
  const resolved = resolveModel(model);
  return SERVED_MODELS.includes(resolved);
}
