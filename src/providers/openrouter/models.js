/**
 * OpenRouter Models Configuration
 * 
 * OpenRouter provides access to 300+ models from various providers
 * Model IDs are in the format: provider/model-name
 * 
 * @module providers/openrouter/models
 */

/**
 * OpenRouter available model providers and examples
 * This is a curated list of popular models available through OpenRouter
 */
export const OPENROUTER_PROVIDERS = {
  // OpenAI models
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
  
  // Anthropic models
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet',
    'claude-3-haiku-20240307',
    'claude-3-haiku',
    'claude-3-opus-20240229',
    'claude-3-opus',
    'claude-3-sonnet-20240229',
    'claude-3-sonnet',
    'claude-2.1',
    'claude-2',
    'claude-instant-1.2',
  ],
  
  // Google models
  google: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-pro',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro',
  ],
  
  // Meta models
  meta: [
    'llama-3.3-70b',
    'llama-3.3-70b-instruct',
    'llama-3.2-90b',
    'llama-3.2-90b-vision',
    'llama-3.2-11b',
    'llama-3.2-11b-vision',
    'llama-3.2-3b',
    'llama-3.2-3b-vision',
    'llama-3.2-1b',
    'llama-3.1-70b',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b',
    'llama-3.1-8b-instant',
  ],
  
  // Mistral models
  mistralai: [
    'mistral-large-3-5',
    'mistral-large-3',
    'mistral-large-2',
    'mistral-small-3',
    'mistral-small-2',
    'mistral-tiny-2',
    'codestral-latest',
    'codestral-2405',
  ],
  
  // Cohere models
  cohere: [
    'command-r-plus',
    'command-r',
    'command',
    'embed-english-v3',
    'embed-multilingual-v3',
  ],
  
  // Groq models (via OpenRouter)
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.3-70b-instant',
    'mixtral-8x7b-32768',
    'qwen3-72b',
  ],
  
  // DeepSeek models
  deepseek: [
    'deepseek-r1',
    'deepseek-chat',
    'deepseek-coder',
  ],
  
  // Fireworks models
  fireworks: [
    'llama-3.1-70b',
    'llama-3.1-8b',
    'mixtral-8x7b',
  ],
};

/**
 * Get all available OpenRouter model IDs
 * 
 * @returns {Array<string>} List of all model IDs
 */
export function getAllModelIds() {
  const allModels = [];
  for (const [provider, models] of Object.entries(OPENROUTER_PROVIDERS)) {
    for (const model of models) {
      allModels.push(`${provider}/${model}`);
    }
  }
  return allModels;
}

/**
 * Popular OpenRouter models for quick access
 */
export const POPULAR_MODELS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-3-5-sonnet',
  'anthropic/claude-3-haiku',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'meta/llama-3.3-70b',
  'meta/llama-3.2-90b',
  'mistralai/mistral-large-3-5',
  'mistralai/mistral-small-3',
  'deepseek/deepseek-r1',
  'groq/llama-3.3-70b-versatile',
];

/**
 * Model aliases for OpenRouter
 */
export const MODEL_ALIASES = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4': 'openai/gpt-4',
  'gpt-3.5': 'openai/gpt-3.5-turbo',
  'claude-3-5-sonnet': 'anthropic/claude-3-5-sonnet',
  'claude-3-sonnet': 'anthropic/claude-3-sonnet-20240229',
  'claude-3-haiku': 'anthropic/claude-3-haiku-20240307',
  'claude-2': 'anthropic/claude-2',
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  'gemini-2.5-pro': 'google/gemini-2.5-pro',
  'llama-3.3-70b': 'meta/llama-3.3-70b',
  'llama-3.2-90b': 'meta/llama-3.2-90b',
  'mistral-large': 'mistralai/mistral-large-3-5',
  'mistral-small': 'mistralai/mistral-small-3',
  'codestral': 'mistralai/codestral-latest',
  'deepseek-r1': 'deepseek/deepseek-r1',
};

/**
 * Default OpenRouter model
 */
export const DEFAULT_MODEL = 'openai/gpt-4o';

/**
 * Resolve an OpenRouter model name to its canonical ID
 * 
 * @param {string} name - Model name or alias
 * @returns {string} Canonical model ID
 */
export function resolveModel(name) {
  if (!name) {
    return DEFAULT_MODEL;
  }
  
  const normalizedName = name.trim().toLowerCase();
  
  // Check if it's already in provider/model format
  if (name.includes('/')) {
    const [provider, model] = name.split('/');
    if (OPENROUTER_PROVIDERS[provider] && OPENROUTER_PROVIDERS[provider].includes(model)) {
      return name;
    }
  }
  
  // Check aliases
  if (MODEL_ALIASES[normalizedName]) {
    return MODEL_ALIASES[normalizedName];
  }
  
  // Return as-is if it looks like a valid model ID
  if (name.includes('/') || name.includes('-') || name.includes('.')) {
    return name;
  }
  
  return DEFAULT_MODEL;
}

/**
 * Get list of available OpenRouter models in OpenAI format
 * 
 * @returns {Array<Object>} List of model objects
 */
export function getModels() {
  const now = Math.floor(Date.now() / 1000);
  const allModels = getAllModelIds();
  
  return allModels.map(model => {
    const [provider] = model.split('/');
    return {
      id: model,
      object: 'model',
      created: now,
      owned_by: provider,
      provider: 'openrouter'
    };
  });
}

/**
 * Get list of popular OpenRouter models only
 * 
 * @returns {Array<Object>} List of popular model objects
 */
export function getPopularModels() {
  const now = Math.floor(Date.now() / 1000);
  
  return POPULAR_MODELS.map(model => {
    const [provider] = model.split('/');
    return {
      id: model,
      object: 'model',
      created: now,
      owned_by: provider,
      provider: 'openrouter'
    };
  });
}

/**
 * Check if a model is supported by OpenRouter
 * 
 * @param {string} model - Model ID to check
 * @returns {boolean} True if the model is supported
 */
export function isModelSupported(model) {
  if (!model) return false;
  
  const allModels = getAllModelIds();
  const resolved = resolveModel(model);
  return allModels.includes(resolved);
}
