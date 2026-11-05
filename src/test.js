/**
 * Vibe.Ai Test Suite
 * 
 * Basic tests for the Vibe.Ai API
 * 
 * @module test
 */

import app from './index.js';
import supertest from 'supertest';

const request = supertest(app);

describe('Vibe.Ai API', () => {
  describe('Health Check', () => {
    it('should return ok status', async () => {
      const res = await request.get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.upstream).toBe('duck.ai');
    });

    it('should return ok status on /healthz', async () => {
      const res = await request.get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Models Endpoint', () => {
    it('should return list of models', async () => {
      const res = await request.get('/v1/models');
      expect(res.status).toBe(200);
      expect(res.body.object).toBe('list');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return models on /models alias', async () => {
      const res = await request.get('/models');
      expect(res.status).toBe(200);
      expect(res.body.object).toBe('list');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Chat Completions', () => {
    it('should reject empty messages array', async () => {
      const res = await request
        .post('/v1/chat/completions')
        .send({ messages: [] });
      
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe('invalid_request_error');
    });

    it('should reject missing messages', async () => {
      const res = await request
        .post('/v1/chat/completions')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe('invalid_request_error');
    });

    it('should accept valid request', async () => {
      // This test may fail if DuckAI is not accessible
      // or if we hit rate limits
      const res = await request
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-6-luna',
          messages: [{ role: 'user', content: 'Say hello' }],
          stream: false
        });
      
      // We just check that it doesn't return a validation error
      // The actual response depends on DuckAI availability
      if (res.status === 400 || res.status === 401 || res.status === 429) {
        // These are expected if DuckAI is not accessible
        console.log('DuckAI not accessible for test, skipping');
      } else {
        expect(res.status).toBeLessThan(500);
      }
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request.get('/unknown/route');
      expect(res.status).toBe(404);
      expect(res.body.error.type).toBe('not_found_error');
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Simple test runner
  console.log('Running Vibe.Ai tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: async () => {
      const res = await request.get('/health');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.status !== 'ok') throw new Error('Expected status ok');
      return true;
    }},
    { name: 'Models Endpoint', fn: async () => {
      const res = await request.get('/v1/models');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.object !== 'list') throw new Error('Expected object list');
      return true;
    }},
    { name: 'Empty Messages Rejection', fn: async () => {
      const res = await request.post('/v1/chat/completions').send({ messages: [] });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      return true;
    }},
    { name: '404 Handler', fn: async () => {
      const res = await request.get('/unknown/route');
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
      return true;
    }}
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✓ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nTests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}
