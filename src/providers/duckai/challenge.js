/**
 * DuckAI Challenge Solver
 * 
 * Solves DuckDuckGo's anti-abuse challenges using jsdom.
 * This is a direct migration of the original jsa_jsdom.js implementation.
 * 
 * @module providers/duckai/challenge
 */

import { JSDOM } from 'jsdom';

const DEFAULT_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

// Default timeout for challenge solving (20 seconds)
const DEFAULT_SOLVE_TIMEOUT = 20000;

/**
 * Solves a DuckAI challenge script and returns the proof material.
 * 
 * @param {string} jsSource - The challenge JavaScript code from DuckAI
 * @param {string} [userAgent=DEFAULT_UA] - User agent string to use
 * @param {number} [timeout=DEFAULT_SOLVE_TIMEOUT] - Timeout in milliseconds
 * @returns {Promise<Object>} The solved challenge result with server_hashes, client_hashes, signals, and meta
 * @throws {Error} If the challenge cannot be solved or times out
 */
export async function solveChallenge(jsSource, userAgent = DEFAULT_UA, timeout = DEFAULT_SOLVE_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Create a promise that can be aborted
    const solvePromise = _solveChallengeInternal(jsSource, userAgent);
    
    // Race between the solve promise and timeout
    const result = await Promise.race([
      solvePromise,
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`Challenge solving timeout after ${timeout}ms`));
        });
      })
    ]);
    
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Internal function to solve the challenge without timeout
 * 
 * @param {string} jsSource - The challenge JavaScript code
 * @param {string} userAgent - User agent string
 * @returns {Promise<Object>} Solved challenge result
 */
async function _solveChallengeInternal(jsSource, userAgent) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://duck.ai/',
    userAgent: userAgent,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });

  const w = dom.window;

  // Force correct navigator properties that jsdom might not get right
  try {
    Object.defineProperty(w.navigator, 'userAgent', {
      get: () => userAgent,
      configurable: true
    });
    Object.defineProperty(w.navigator, 'appVersion', {
      get: () => userAgent.replace('Mozilla/', ''),
      configurable: true
    });
    Object.defineProperty(w.navigator, 'webdriver', {
      get: () => false,
      configurable: true
    });
  } catch (e) {
    // Ignore errors - some environments may not allow redefining properties
  }

  // jsdom has no layout engine: give the probe element plausible Chrome metrics
  // These values match what real Chrome returns for the challenge probe
  const proto = w.Element.prototype;
  
  for (const [prop, val] of [
    ['offsetWidth', 17], 
    ['offsetHeight', 35], 
    ['scrollHeight', 19],
    ['clientWidth', 17], 
    ['clientHeight', 35]
  ]) {
    Object.defineProperty(proto, prop, {
      get() { return this.__fake || val; },
      configurable: true
    });
  }

  // Override getBoundingClientRect to return consistent values
  proto.getBoundingClientRect = function() {
    return {
      width: 17,
      height: 35,
      top: 0,
      left: 0,
      right: 17,
      bottom: 35,
      x: 0,
      y: 0
    };
  };

  // Execute the challenge script and return the result
  try {
    const result = await w.eval(jsSource);
    
    // Validate the result has the expected structure
    if (!result || typeof result !== 'object') {
      throw new Error('Challenge script returned invalid result');
    }
    
    if (result.__error) {
      throw new Error(`Challenge error: ${result.__error}`);
    }
    
    // Ensure required fields exist
    if (!result.server_hashes || !result.client_hashes) {
      throw new Error('Challenge result missing required fields');
    }
    
    return result;
  } catch (e) {
    // Enhance error with stack trace if available
    const errorMessage = e && e.stack ? e.stack : String(e);
    throw new Error(`Challenge solver failed: ${errorMessage}`);
  } finally {
    // Clean up the DOM to free memory
    try {
      dom.window.close();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Builds the proof header from solved challenge data.
 * 
 * @param {Object} solved - The solved challenge data
 * @param {string} [origin='https://duck.ai'] - The origin to use in metadata
 * @returns {string} Base64-encoded proof string for X-Vqd-Hash-1 header
 */
export function buildProof(solved, origin = 'https://duck.ai') {
  const proof = { ...solved };
  
  // Hash the client_hashes using SHA-256
  const clientHashes = solved.client_hashes.map(hash => {
    // The client_hashes from the solver are raw strings that need to be hashed
    const rawString = hash;
    const sha256 = crypto.createHash('sha256');
    sha256.update(rawString, 'utf8');
    return Buffer.from(sha256.digest()).toString('base64');
  });
  
  proof.client_hashes = clientHashes;
  
  // Build metadata
  const meta = { ...solved.meta } || {};
  meta.origin = origin;
  meta.stack = 'Error\nat l (https://duck.ai/dist/duckai-dist/entry.duckai.js:2:2129171)\n'
    + 'at async https://duck.ai/dist/duckai-dist/entry.duckai.js:2:1859809';
  meta.duration = '58';
  
  proof.meta = meta;
  
  // Convert to base64 JSON
  const proofJson = JSON.stringify(proof);
  return Buffer.from(proofJson, 'utf8').toString('base64');
}

export { DEFAULT_UA, DEFAULT_SOLVE_TIMEOUT };
