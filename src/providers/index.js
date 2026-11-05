/**
 * AI Providers
 * 
 * Main module for all AI providers.
 * Currently implements DuckAI provider with modular architecture
 * for future providers.
 * 
 * @module providers
 */

import * as duckai from './duckai/index.js';

/**
 * Provider registry
 */
const providers = {
  duckai
};

/**
 * Get a provider by name
 * 
 * @param {string} name - Provider name (e.g., 'duckai')
 * @returns {Object} The provider module
 * @throws {Error} If provider is not found
 */
export function getProvider(name) {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Provider '${name}' not found`);
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
 * Register a new provider
 * 
 * @param {string} name - Provider name
 * @param {Object} provider - Provider module
 */
export function registerProvider(name, provider) {
  providers[name] = provider;
}

// Re-export DuckAI provider for convenience
export { duckai };
export default providers;
