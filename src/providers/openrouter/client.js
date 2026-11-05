/**
 * OpenRouter Client
 * 
 * Node.js client for OpenRouter's unified API
 * 
 * @module providers/openrouter/client
 */

import { resolveModel, DEFAULT_MODEL } from './models.js';

const BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter Error
 */
export class OpenRouterError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
  }
}

/**
 * OpenRouter Client
 * Wraps OpenRouter's unified API for accessing 300+ models
 */
export class OpenRouterClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    this.timeout = options.timeout || 180000; // 3 minutes
    this.baseUrl = options.baseUrl || BASE_URL;
    this.siteUrl = options.siteUrl || null;
    this.siteName = options.siteName || null;
  }

  /**
   * Check if API key is configured
   * 
   * @returns {boolean} True if API key is configured
   */
  hasApiKey() {
    return !!(this.apiKey && this.apiKey.trim());
  }

  /**
   * Get request headers including optional site info
   * 
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (this.siteUrl) {
      headers['HTTP-Referer'] = this.siteUrl;
    }
    if (this.siteName) {
      headers['X-Title'] = this.siteName;
    }

    return headers;
  }

  /**
   * List available models
   * 
   * @returns {Promise<Array<Object>>} List of model objects
   */
  async listModels() {
    if (!this.hasApiKey()) {
      throw new OpenRouterError('OpenRouter API key is required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new OpenRouterError(
          `Failed to list models: HTTP ${response.status} - ${errorText}`,
          response.status
        );
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new OpenRouterError(`Failed to list models: ${error.message}`, error.status);
    }
  }

  /**
   * Create a chat completion
   * 
   * @param {string} prompt - The user prompt (already processed)
   * @param {Object} options - Options
   * @param {string} [options.model=DEFAULT_MODEL] - Model to use
   * @param {boolean} [options.stream=false] - Whether to stream the response
   * @param {number} [options.temperature=0.7] - Sampling temperature
   * @param {number} [options.maxTokens] - Maximum tokens to generate
   * @param {Array<Object>} [options.messages] - Raw messages (if prompt is not provided)
   * @returns {Promise<Response>} Response
   */
  async createChatCompletion(prompt, options = {}) {
    const {
      model = DEFAULT_MODEL,
      stream = false,
      temperature = 0.7,
      maxTokens = null,
      messages = null
    } = options;

    if (!this.hasApiKey()) {
      throw new OpenRouterError('OpenRouter API key is required');
    }

    const resolvedModel = resolveModel(model);
    
    // Build the request body
    const body = {
      model: resolvedModel,
      temperature,
    };

    if (messages) {
      body.messages = messages;
    } else if (prompt) {
      body.messages = [{ role: 'user', content: prompt }];
    } else {
      throw new OpenRouterError('Either prompt or messages must be provided');
    }

    if (maxTokens) {
      body.max_tokens = maxTokens;
    }

    // Add site info if configured
    if (this.siteUrl) {
      body.site_url = this.siteUrl;
    }
    if (this.siteName) {
      body.site_name = this.siteName;
    }

    const url = `${this.baseUrl}/chat/completions`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new OpenRouterError(
          `Chat completion failed: HTTP ${response.status} - ${errorText}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      throw new OpenRouterError(`Chat completion failed: ${error.message}`, error.status);
    }
  }

  /**
   * Stream a chat completion
   * 
   * @param {string} prompt - The user prompt
   * @param {Object} options - Options
   * @param {string} [options.model=DEFAULT_MODEL] - Model to use
   * @param {number} [options.temperature=0.7] - Sampling temperature
   * @param {number} [options.maxTokens] - Maximum tokens to generate
   * @returns {Promise<Response>} Streaming response
   */
  async streamChatCompletion(prompt, options = {}) {
    return this.createChatCompletion(prompt, { ...options, stream: true });
  }

  /**
   * Get a single chat completion (non-streaming)
   * 
   * @param {string} prompt - The user prompt
   * @param {Object} options - Options
   * @param {string} [options.model=DEFAULT_MODEL] - Model to use
   * @param {number} [options.temperature=0.7] - Sampling temperature
   * @param {number} [options.maxTokens] - Maximum tokens to generate
   * @returns {Promise<string>} The complete response text
   */
  async ask(prompt, options = {}) {
    const response = await this.createChatCompletion(prompt, options);
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new OpenRouterError('No choices returned in response');
    }

    const content = data.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  }
}

export { BASE_URL, DEFAULT_MODEL };
