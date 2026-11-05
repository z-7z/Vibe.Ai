/**
 * Groq Models Configuration
 * 
 * @module providers/groq/models
 */

/**
 * Groq available models
 * These are the main models offered by Groq
 */
export const GROQ_MODELS = [
  // Llama models
  'llama-3.3-70b-versatile',
  'llama-3.3-70b-instant',
  'llama-3.2-90b-vision',
  'llama-3.2-11b-vision',
  'llama-3.2-3b-vision',
  'llama-3.2-90b',
  'llama-3.2-11b',
  'llama-3.2-3b',
  'llama-3.2-1b',
  'llama-3.1-70b-versatile',
  'llama-3.1-70b',
  'llama-3.1-8b-instant',
  'llama-3.1-8b',
  'llama3-8b-8192',
  'llama3-70b-8192',
  
  // Mixtral models
  'mixtral-8x7b-32768',
  'mixtral-8x7b-instruct-2407',
  
  // Other models
  'gemma2-9b-it',
  'gemma-7b-it',
  'qwen3-72b',
  'qwen3-32b',
  'qwen3-14b',
  'qwen3-8b',
  'qwen3-4b',
  'qwen3-1.8b',
  'qwen-72b',
  'qwen-14b',
  'qwen-7b',
  
  // Open models
  'openchat-3.6-8b',
  'openchat-3.5-7b',
  'openchat-3.5-12b',
  
  // Whisper (for audio)
  'whisper-large-v3',
  'whisper-large-v3-turbo',
];

/**
 * Model aliases for Groq
 */
export const MODEL_ALIASES = {
  'llama-70b': 'llama-3.3-70b-versatile',
  'llama-70b-versatile': 'llama-3.3-70b-versatile',
  'llama-70b-instant': 'llama-3.3-70b-instant',
  'llama-11b': 'llama-3.2-11b',
  'llama-3b': 'llama-3.2-3b',
  'llama-1b': 'llama-3.2-1b',
  'mixtral-8x7b': 'mixtral-8x7b-32768',
  'mixtral': 'mixtral-8x7b-32768',
  'gemma-9b': 'gemma2-9b-it',
  'gemma-7b': 'gemma-7b-it',
  'qwen-72b': 'qwen3-72b',
  'qwen-32b': 'qwen3-32b',
  'qwen-14b': 'qwen3-14b',
  'qwen-8b': 'qwen3-8b',
};

/**
 * Default Groq model
 */
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Resolve a Groq model name to its canonical ID
 * 
 * @param {string} name - Model name or alias
 * @returns {string} Canonical model ID
 */
export function resolveModel(name) {
  if (!name) {
    return DEFAULT_MODEL;
  }
  
  const normalizedName = name.trim().toLowerCase();
  
  if (GROQ_MODELS.includes(normalizedName)) {
    return normalizedName;
  }
  
  if (MODEL_ALIASES[normalizedName]) {
    return MODEL_ALIASES[normalizedName];
  }
  
  // Return as-is if it looks like a valid model ID
  if (normalizedName.includes('-') || normalizedName.includes('.')) {
    return name;
  }
  
  return DEFAULT_MODEL;
}

/**
 * Get list of available Groq models in OpenAI format
 * 
 * @returns {Array<Object>} List of model objects
 */
export function getModels() {
  const now = Math.floor(Date.now() / 1000);
  
  return GROQ_MODELS.map(model => ({
    id: model,
    object: 'model',
    created: now,
    owned_by: 'groq.com',
    provider: 'groq'
  }));
}

/**
 * Check if a model is supported by Groq
 * 
 * @param {string} model - Model ID to check
 * @returns {boolean} True if the model is supported
 */
export function isModelSupported(model) {
  if (!model) return false;
  
  const resolved = resolveModel(model);
  return GROQ_MODELS.includes(resolved);
}
