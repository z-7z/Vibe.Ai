/**
 * AI Providers
 * 
 * Main module for all AI providers.
 * Implements a modular architecture for easy provider integration.
 * 
 * @module providers
 */

import * as duckai from './duckai/index.js';
import * as mistral from './mistral/index.js';
import * as groq from './groq/index.js';
import * as openrouter from './openrouter/index.js';

/**
 * Provider registry
 * Maps provider names to their implementation modules
 */
const providers = {
  duckai,
  mistral,
  groq,
  openrouter
};

/**
 * Get a provider by name
 * 
 * @param {string} name - Provider name (e.g., 'duckai', 'mistral', 'groq', 'openrouter')
 * @returns {Object} The provider module
 * @throws {Error} If provider is not found
 */
export function getProvider(name) {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Provider '${name}' not found. Available providers: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

/**
 * Check if a provider exists
 * 
 * @param {string} name - Provider name
 * @returns {boolean} True if provider exists
 */
export function hasProvider(name) {
  return providers[name] !== undefined;
}

/**
 * Get all available provider names
 * 
 * @returns {string[]} Array of provider names
 */
export function getProviderNames() {
  return Object.keys(providers);
}

/**
 * Register a new provider at runtime
 * 
 * @param {string} name - Provider name
 * @param {Object} provider - Provider module
 */
export function registerProvider(name, provider) {
  providers[name] = provider;
}

/**
 * Get all models from all providers
 * 
 * @returns {Array<Object>} Combined list of all models
 */
export function getAllModels() {
  const allModels = [];
  
  for (const [providerName, provider] of Object.entries(providers)) {
    try {
      if (typeof provider.getModels === 'function') {
        const models = provider.getModels();
        if (Array.isArray(models)) {
          // Add provider tag to each model
          const taggedModels = models.map(model => ({
            ...model,
            provider: providerName
          }));
          allModels.push(...taggedModels);
        }
      }
    } catch (e) {
      // Skip providers that can't list models without API key
      console.warn(`Could not get models for provider ${providerName}: ${e.message}`);
    }
  }
  
  return allModels;
}

/**
 * Resolve a model to its provider
 * Tries to find which provider supports the given model
 * 
 * @param {string} model - Model ID to resolve
 * @returns {Object} Object with provider name and resolved model
 */
export function resolveModelToProvider(model) {
  for (const [providerName, provider] of Object.entries(providers)) {
    try {
      if (typeof provider.resolveModel === 'function' && typeof provider.isModelSupported === 'function') {
        const resolvedModel = provider.resolveModel(model);
        if (provider.isModelSupported(resolvedModel)) {
          return {
            provider: providerName,
            model: resolvedModel
          };
        }
      }
    } catch (e) {
      // Skip providers that can't resolve models without API key
    }
  }
  
  // Default to duckai if no provider found
  return {
    provider: 'duckai',
    model: duckai.resolveModel(model)
  };
}

// Re-export all providers for convenience
export { duckai, mistral, groq, openrouter };

export default providers;
