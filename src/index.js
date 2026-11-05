/**
 * Vibe.Ai Server
 * 
 * Main entry point for the Vibe.Ai API server.
 * Implements OpenAI-compatible endpoints for DuckAI provider.
 * 
 * @module index
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getProvider } from './providers/index.js';
import { rateLimiter, startRateLimitCleanup } from './middleware/index.js';
import { authMiddleware } from './middleware/auth.js';
import { PORT, HOST, isApiKeyRequired, UPSTREAM_MAX_CONCURRENT } from './config.js';
import { buildPrompt, fitPrompt, processMessages } from './utils/prompt.js';
import { createError, createValidationError, createAuthError, createNotFoundError, fromDuckAIError } from './utils/errors.js';
import { getModels as getDuckAIModels, resolveModel, isModelSupported, SERVED_MODELS, DEFAULT_MODEL } from './providers/duckai/models.js';
import { DuckAIClient, DuckAIError } from './providers/duckai/client.js';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Rate limiting middleware (applied to all routes)
app.use(rateLimiter);

// Authentication middleware (applied after rate limiting)
app.use(authMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'info';
    
    console[logLevel](`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Upstream request serialization lock
// DuckDuckGo's fraud score punishes bursts, so serialize upstream calls
const upstreamLocks = new Map();

/**
 * Acquire a lock for a specific provider
 * Ensures only one upstream request per provider at a time
 */
async function acquireUpstreamLock(providerName) {
  if (UPSTREAM_MAX_CONCURRENT <= 1) {
    // Simple lock for single concurrent request
    if (!upstreamLocks.has(providerName)) {
      const lock = { promise: null, resolve: null };
      lock.promise = new Promise(resolve => { lock.resolve = resolve; });
      upstreamLocks.set(providerName, lock);
    }
    
    const lock = upstreamLocks.get(providerName);
    await lock.promise;
    return lock;
  }
  
  // For multiple concurrent requests, use a semaphore
  // This is a simplified implementation
  return { release: () => {} };
}

/**
 * Release a lock for a specific provider
 */
function releaseUpstreamLock(providerName, lock) {
  if (UPSTREAM_MAX_CONCURRENT <= 1 && upstreamLocks.has(providerName)) {
    const currentLock = upstreamLocks.get(providerName);
    if (currentLock === lock) {
      currentLock.resolve();
      upstreamLocks.delete(providerName);
    }
  }
}

// Routes

/**
 * GET /health - Health check endpoint
 * Always accessible, even with API key authentication
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    upstream: 'duck.ai',
    timestamp: Math.floor(Date.now() / 1000),
    version: '1.0.0',
    provider: 'duckai'
  });
});

app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    upstream: 'duck.ai',
    timestamp: Math.floor(Date.now() / 1000),
    version: '1.0.0',
    provider: 'duckai'
  });
});

/**
 * GET /v1/models - List available models
 * Returns OpenAI-compatible model list
 */
app.get('/v1/models', (req, res) => {
  try {
    const models = getDuckAIModels();
    
    res.json({
      object: 'list',
      data: models
    });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json(createError('Failed to list models'));
  }
});

/**
 * GET /models - Alias for /v1/models
 */
app.get('/models', (req, res) => {
  try {
    const models = getDuckAIModels();
    
    res.json({
      object: 'list',
      data: models
    });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json(createError('Failed to list models'));
  }
});

/**
 * POST /v1/chat/completions - Chat completions endpoint
 * OpenAI-compatible chat completions with streaming support
 */
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const body = req.body;
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return res.status(400).json(createValidationError('Request body must be a JSON object'));
    }
    
    // Validate messages
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json(createValidationError("'messages' must be a non-empty array"));
    }
    
    // Validate each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || typeof msg !== 'object') {
        return res.status(400).json(createValidationError(`Message at index ${i} must be an object`));
      }
      if (!msg.role) {
        return res.status(400).json(createValidationError(`Message at index ${i} must have a 'role' field`));
      }
    }
    
    // Resolve model
    let model = body.model;
    if (model) {
      model = resolveModel(model);
      if (!isModelSupported(model)) {
        return res.status(400).json(createValidationError(`Unsupported model: ${model}`));
      }
    } else {
      model = DEFAULT_MODEL;
    }
    
    // Process messages and fit to limit
    const { prompt, fitted, originalLength, fittedLength } = processMessages(messages);
    
    // Log prompt information
    console.log(`DuckAI prompt: ${originalLength} chars -> ${fittedLength} sent`);
    
    // Check if streaming is requested
    const stream = body.stream === true;
    
    // Generate completion ID
    const completionId = `chatcmpl-${uuidv4().replace(/-/g, '')}`;
    const created = Math.floor(Date.now() / 1000);
    
    // Acquire upstream lock to serialize requests
    const lock = await acquireUpstreamLock('duckai');
    
    try {
      const client = new DuckAIClient();
      
      if (stream) {
        // Streaming response
        await handleStreamingRequest(req, res, client, fitted, model, completionId, created);
      } else {
        // Non-streaming response
        await handleNonStreamingRequest(res, client, fitted, model, completionId, created);
      }
    } finally {
      releaseUpstreamLock('duckai', lock);
    }
  } catch (error) {
    console.error('Error in chat completions:', error);
    
    if (error instanceof DuckAIError) {
      const status = error.status === 418 ? 429 : 502;
      return res.status(status).json(fromDuckAIError(error));
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(createValidationError(error.message));
    }
    
    res.status(500).json(createError('Internal server error'));
  }
});

/**
 * POST /chat/completions - Alias for /v1/chat/completions
 */
app.post('/chat/completions', async (req, res) => {
  // Redirect to /v1/chat/completions
  req.url = '/v1/chat/completions';
  return app.handle(req, res);
});

/**
 * Handle streaming chat completion request
 */
async function handleStreamingRequest(req, res, client, prompt, model, completionId, created) {
  const startTime = Date.now();
  let chars = 0;
  
  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    'Connection': 'keep-alive'
  });
  
  // Send initial chunk with role
  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  
  const chunk = (delta, finish = null) => ({
    id: completionId,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta, finish_reason: finish }]
  });
  
  try {
    // Send initial assistant message
    send(chunk({ role: 'assistant', content: '' }));
    
    // Stream the response
    const responseStream = await client.chat(prompt, model);
    
    if (!responseStream.ok) {
      const errorText = await responseStream.text();
      throw new DuckAIError(`Upstream error: ${responseStream.status} - ${errorText}`, responseStream.status);
    }
    
    const reader = responseStream.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunkText = decoder.decode(value, { stream: true });
      const lines = chunkText.split('\n');
      
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
              chars += message.length;
              send(chunk({ content: message }));
            }
          } catch (e) {
            // Ignore JSON parse errors
            continue;
          }
        }
      }
    }
    
    // Send final chunk
    send(chunk({}, 'stop'));
    
    // Send done marker
    res.write('data: [DONE]\n\n');
    
    console.log(`DuckAI ${model} stream ${chars} chars in ${(Date.now() - startTime) / 1000}ms`);
  } catch (error) {
    console.error('Streaming error:', error);
    
    // Try to send error as SSE
    try {
      const errorPayload = {
        error: {
          message: error.message || 'Streaming error',
          type: 'upstream_error',
          code: error.status || 500
        }
      };
      send(errorPayload);
    } catch (e) {
      // Ignore errors when trying to send error
    }
  } finally {
    res.end();
  }
}

/**
 * Handle non-streaming chat completion request
 */
async function handleNonStreamingRequest(res, client, prompt, model, completionId, created) {
  const startTime = Date.now();
  
  try {
    // Get the complete response
    const text = await client.ask(prompt, { model });
    
    // Estimate token counts (approximate: 4 chars per token)
    const promptTokens = Math.max(1, Math.floor(prompt.length / 4));
    const completionTokens = Math.max(1, Math.floor(text.length / 4));
    const totalTokens = promptTokens + completionTokens;
    
    const response = {
      id: completionId,
      object: 'chat.completion',
      created,
      model,
      choices: [{
        index: 0,
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: text
        }
      }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens
      }
    };
    
    res.json(response);
    
    console.log(`DuckAI ${model} non-stream ${text.length} chars in ${(Date.now() - startTime) / 1000}ms`);
  } catch (error) {
    console.error('Non-streaming error:', error);
    
    if (error instanceof DuckAIError) {
      const status = error.status === 418 ? 429 : 502;
      throw error;
    }
    
    throw error;
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json(createNotFoundError(`No route ${req.path}`));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json(createError(message, 'server_error', status));
});

// Start rate limit cleanup
startRateLimitCleanup();

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Vibe.Ai server listening on http://${HOST}:${PORT}/v1`);
  console.log(`Provider: duckai`);
  console.log(`API Key: ${isApiKeyRequired() ? 'required' : 'optional (public mode)'}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export app for testing
export default app;
export { server };
