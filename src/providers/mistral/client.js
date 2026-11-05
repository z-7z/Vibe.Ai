/**
 * Mistral AI Client
 * 
 * Node.js client for Mistral AI's OpenAI-compatible API
 * 
 * @module providers/mistral/client
 */

import { resolveModel, DEFAULT_MODEL } from './models.js';

const BASE_URL = 'https://api.mistral.ai/v1';

/**
 * Mistral AI Error
 */
export class MistralError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'MistralError';
    this.status = status;
  }
}

/**
 * Mistral AI Client
 * Wraps Mistral's OpenAI-compatible API
 */
export class MistralClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.MISTRAL_API_KEY;
    this.timeout = options.timeout || 180000; // 3 minutes
    this.baseUrl = options.baseUrl || BASE_URL;
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
   * List available models
   * 
   * @returns {Promise<Array<Object>>} List of model objects
   */
  async listModels() {
    if (!this.hasApiKey()) {
      throw new MistralError('Mistral API key is required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new MistralError(
          `Failed to list models: HTTP ${response.status} - ${errorText}`,
          response.status
        );
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new MistralError(`Failed to list models: ${error.message}`, error.status);
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
   * @returns {Promise<Response|AsyncIterable>} Response or stream
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
      throw new MistralError('Mistral API key is required');
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
      throw new MistralError('Either prompt or messages must be provided');
    }

    if (maxTokens) {
      body.max_tokens = maxTokens;
    }

    const url = `${this.baseUrl}/chat/completions`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new MistralError(
          `Chat completion failed: HTTP ${response.status} - ${errorText}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      throw new MistralError(`Chat completion failed: ${error.message}`, error.status);
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
      throw new MistralError('No choices returned in response');
    }

    const content = data.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  }
}

export { BASE_URL, DEFAULT_MODEL };
