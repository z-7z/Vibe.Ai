/**
 * Prompt Utilities
 * 
 * Utilities for building and processing prompts for AI providers.
 * This is a migration of the prompt building logic from the original DuckAI server.
 * 
 * @module utils/prompt
 */

import { MAX_PROMPT_CHARS } from '../config.js';

const OMIT_MARKER = '\n\n[... middle omitted to fit duck.ai\'s input limit ...]\n\n';

/**
 * Extract text from OpenAI message content
 * Handles both string content and array of content parts
 * 
 * @param {string|Array} content - OpenAI message content
 * @returns {string} Extracted text
 */
export function textOf(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const parts = [];
    for (const part of content) {
      if (typeof part === 'string') {
        parts.push(part);
      } else if (part && typeof part === 'object') {
        if (typeof part.text === 'string') {
          parts.push(part.text);
        } else if (part.type === 'image_url') {
          parts.push('[image omitted: Vibe.Ai is text-only]');
        }
      }
    }
    return parts.join('\n');
  }

  return content === null ? '' : String(content);
}

/**
 * Build a prompt from OpenAI messages
 * Folds system messages and conversation history into a single user turn
 * as required by DuckAI
 * 
 * @param {Array<Object>} messages - OpenAI messages array
 * @returns {string} The built prompt
 */
export function buildPrompt(messages) {
  const system = [];
  const convo = [];

  for (const msg of messages || []) {
    const role = String(msg.role || 'user').toLowerCase();
    const text = textOf(msg.content).trim();

    if (!text) {
      continue;
    }

    if (role === 'system') {
      system.push(text);
    } else if (role === 'assistant') {
      convo.push(['Assistant', text]);
    } else if (role === 'tool') {
      convo.push(['Tool result', text]);
    } else {
      // user, developer, or any unknown role
      convo.push(['User', text]);
    }
  }

  // If there are system messages but no conversation, add a default user message
  if (!convo.length && system.length) {
    convo.push(['User', 'Follow the system instructions above.']);
  }

  const blocks = [];

  // Add system instructions
  if (system.length) {
    blocks.push('System instructions:\n' + system.join('\n\n'));
  }

  // Add conversation history
  if (convo.length > 1) {
    const history = convo.slice(0, -1).map(([label, text]) => `${label}: ${text}`).join('\n\n');
    blocks.push('Conversation so far:\n' + history);
    blocks.push('Current message:\n' + convo[convo.length - 1][1]);
  } else if (convo.length) {
    blocks.push(convo[0][1]);
  }

  return blocks.join('\n\n').trim() || 'Hello';
}

/**
 * Fit a prompt to the maximum character limit
 * Uses head+tail trimming to preserve system instructions and recent context
 * 
 * @param {string} prompt - The prompt to fit
 * @param {number} [limit=MAX_PROMPT_CHARS] - Maximum character limit
 * @returns {string} The fitted prompt
 */
export function fitPrompt(prompt, limit = MAX_PROMPT_CHARS) {
  if (limit <= 0 || prompt.length <= limit) {
    return prompt;
  }

  const head = Math.floor(limit * 0.55);
  const tail = Math.max(0, limit - head - OMIT_MARKER.length);

  return prompt.slice(0, head) + OMIT_MARKER + (tail > 0 ? prompt.slice(-tail) : '');
}

/**
 * Process messages and return a fitted prompt
 * 
 * @param {Array<Object>} messages - OpenAI messages array
 * @param {number} [limit=MAX_PROMPT_CHARS] - Maximum character limit
 * @returns {Object} Object with original and fitted prompt lengths
 */
export function processMessages(messages, limit = MAX_PROMPT_CHARS) {
  const prompt = buildPrompt(messages);
  const fitted = fitPrompt(prompt, limit);

  return {
    prompt,
    fitted,
    originalLength: prompt.length,
    fittedLength: fitted.length,
    trimmed: prompt.length !== fitted.length
  };
}

export { OMIT_MARKER };
