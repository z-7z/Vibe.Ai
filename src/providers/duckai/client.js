/**
 * DuckAI Client
 * 
 * Node.js implementation of the DuckAI protocol.
 * This is a complete migration from the original Python duckai_client.py.
 * 
 * @module providers/duckai/client
 */

import { solveChallenge, buildProof, DEFAULT_UA } from './challenge.js';
import { resolveModel, DEFAULT_MODEL } from './models.js';

const BASE = 'https://duck.ai';
const MAX_RETRIES = 4;
const RETRY_DELAY_BASE = 2000; // 2 seconds base delay

/**
 * DuckAI Client Error
 */
export class DuckAIError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'DuckAIError';
    this.status = status;
  }
}

/**
 * DuckAI Client for interacting with DuckDuckGo's chat API
 */
export class DuckAIClient {
  constructor(options = {}) {
    this.ua = options.userAgent || DEFAULT_UA;
    this.timeout = options.timeout || 60000; // 60 seconds
    this.feVersion = '';
    this.jsa = null;
    this.sessionId = options.sessionId || null;
  }

  /**
   * Bootstrap the client by fetching the frontend version
   * This is step 1 of the DuckAI protocol
   * 
   * @returns {Promise<DuckAIClient>} Returns this for chaining
   */
  async bootstrap() {
    try {
      const response = await fetch(`${BASE}/`, {
        method: 'GET',
        headers: {
          'User-Agent': this.ua,
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new DuckAIError(
          `Bootstrap failed: HTTP ${response.status}`,
          response.status
        );
      }

      const html = await response.text();
      
      // Extract version tag and sha from HTML
      const tagMatch = html.match(/data-version-tag="([^"]*)"/);
      const shaMatch = html.match(/data-version-sha="([^"]*)"/);
      
      this.feVersion = `${tagMatch ? tagMatch[1] : 'dev'}-${shaMatch ? shaMatch[1] : 'hash'}`;
      
      return this;
    } catch (error) {
      throw new DuckAIError(`Bootstrap failed: ${error.message}`, error.status);
    }
  }

  /**
   * Fetch a challenge from the DuckAI status endpoint
   * This is step 2 of the DuckAI protocol
   * 
   * @returns {Promise<string>} The challenge JavaScript source code
   */
  async fetchChallenge() {
    if (!this.feVersion) {
      await this.bootstrap();
    }

    try {
      const response = await fetch(`${BASE}/duckchat/v1/status`, {
        method: 'GET',
        headers: {
          'x-vqd-accept': '1',
          'Cache-Control': 'no-store',
          'x-fe-version': this.feVersion,
          'Origin': BASE,
          'Referer': `${BASE}/`,
          'User-Agent': this.ua
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new DuckAIError(
          `Failed to fetch challenge: HTTP ${response.status}`,
          response.status
        );
      }

      const challengeHeader = response.headers.get('x-vqd-hash-1');
      
      if (!challengeHeader) {
        throw new DuckAIError('No challenge header received', response.status);
      }

      // Decode the base64 challenge
      const challengeBuffer = Buffer.from(challengeHeader, 'base64');
      return challengeBuffer.toString('utf8');
    } catch (error) {
      throw new DuckAIError(`Failed to fetch challenge: ${error.message}`, error.status);
    }
  }

  /**
   * Solve a challenge and build the proof
   * This combines steps 3 and 4 of the DuckAI protocol
   * 
   * @param {string} jsSource - The challenge JavaScript code
   * @returns {Promise<string>} The base64-encoded proof for X-Vqd-Hash-1 header
   */
  async solveAndBuildProof(jsSource) {
    const solved = await solveChallenge(jsSource, this.ua);
    this.jsa = buildProof(solved, BASE);
    return this.jsa;
  }

  /**
   * Send a chat request to DuckAI
   * This is step 5 of the DuckAI protocol
   * 
   * @param {string} prompt - The user prompt
   * @param {string} [model=DEFAULT_MODEL] - Model to use
   * @param {boolean} [tools=false] - Whether to enable tools
   * @returns {Promise<Response>} The response from DuckAI
   */
  async chat(prompt, model = DEFAULT_MODEL, tools = false) {
    if (!this.jsa) {
      throw new DuckAIError('Proof not initialized. Call solveAndBuildProof first.');
    }

    const resolvedModel = resolveModel(model);
    const timestamp = Date.now();

    const body = {
      model: resolvedModel,
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: prompt }]
      }],
      canUseTools: tools,
      reasoningEffort: 'none',
      canUseApproxLocation: null,
      canDelegateImageGeneration: null,
      canShowGreeting: false
    };

    const signals = {
      start: timestamp,
      events: [{ name: 'action', delta: 1200, trusted: true }],
      end: 1500
    };

    // Encode signals to base64
    const signalsJson = JSON.stringify(signals);
    const signalsBase64 = Buffer.from(signalsJson, 'utf8').toString('base64');

    try {
      const response = await fetch(`${BASE}/duckchat/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Origin': BASE,
          'Referer': `${BASE}/`,
          'x-fe-version': this.feVersion,
          'x-fe-signals': signalsBase64,
          'X-Vqd-Hash-1': this.jsa,
          'User-Agent': this.ua
        },
        body: JSON.stringify(body),
        timeout: this.timeout
      });

      return response;
    } catch (error) {
      throw new DuckAIError(`Chat request failed: ${error.message}`, error.status);
    }
  }

  /**
   * Stream a chat completion from DuckAI
   * 
   * @param {string} prompt - The user prompt
   * @param {Object} [options] - Options
   * @param {string} [options.model=DEFAULT_MODEL] - Model to use
   * @param {number} [options.retries=MAX_RETRIES] - Number of retry attempts
   * @param {Function} [options.onDelta] - Callback for each delta (for streaming output)
   * @returns {Promise<string>} The complete response text
   */
  async stream(prompt, options = {}) {
    const {
      model = DEFAULT_MODEL,
      retries = MAX_RETRIES,
      onDelta = null
    } = options;

    let lastError = null;
    let status = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Fresh bootstrap and challenge for each attempt
        await this.bootstrap();
        const jsSource = await this.fetchChallenge();
        await this.solveAndBuildProof(jsSource);
        
        const response = await this.chat(prompt, model);
        
        if (response.ok) {
          // Successfully got a response, process the stream
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let completeText = '';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            
            // Parse SSE events
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const event = JSON.parse(data);
                  const message = event.message;
                  
                  if (typeof message === 'string' && message) {
                    completeText += message;
                    if (onDelta) {
                      onDelta(message);
                    }
                  }
                } catch (e) {
                  // Ignore JSON parse errors for individual lines
                  continue;
                }
              }
            }
          }

          return completeText;
        } else {
          // Request failed, store error for retry
          lastError = new DuckAIError(
            `HTTP ${response.status}: ${await response.text()}`,
            response.status
          );
          status = response.status;

          // Wait before retrying (exponential backoff)
          const delay = RETRY_DELAY_BASE * (attempt + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error;
        status = error.status || 500;

        // Wait before retrying
        const delay = RETRY_DELAY_BASE * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    throw new DuckAIError(
      `Chat failed after ${retries} attempts: ${lastError.message}`,
      status
    );
  }

  /**
   * Get a single chat completion (non-streaming)
   * 
   * @param {string} prompt - The user prompt
   * @param {Object} [options] - Options
   * @param {string} [options.model=DEFAULT_MODEL] - Model to use
   * @param {number} [options.retries=MAX_RETRIES] - Number of retry attempts
   * @returns {Promise<string>} The complete response text
   */
  async ask(prompt, options = {}) {
    const { model = DEFAULT_MODEL, retries = MAX_RETRIES } = options;
    let completeText = '';

    await this.stream(prompt, {
      model,
      retries,
      onDelta: (delta) => {
        completeText += delta;
      }
    });

    return completeText;
  }
}

export { BASE, MAX_RETRIES, DEFAULT_UA };
