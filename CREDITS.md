# Vibe.Ai Credits

## Project Information

**Vibe.Ai** is an independent Node.js migration and extension of the original open-source **DuckAI** project.

- **Website**: [https://ai.zeox.xyz](https://ai.zeox.xyz)
- **GitHub**: [https://github.com/z-7z/Vibe.Ai](https://github.com/z-7z/Vibe.Ai)
- **TikTok**: [https://tiktok.com/realzeoxhere](https://tiktok.com/realzeoxhere)
- **Made By**: Mistral AI And Zeox

## Original Project

This project is based on the excellent work of:

- **Original Project**: [DuckAI](https://github.com/revesis/duckai)
- **Original Author**: [revesis](https://github.com/revesis)
- **Original License**: 0BSD (Zero-Clause BSD)

## Migration Details

### What Was Migrated

The following components from DuckAI were migrated to Node.js:

1. **DuckAI Protocol Implementation**
   - Challenge fetching and solving mechanism
   - Proof generation (X-Vqd-Hash-1)
   - Streaming chat completions
   - Model selection and configuration

2. **JavaScript Challenge Solver**
   - The `jsa_jsdom.js` implementation was preserved and integrated
   - Uses jsdom for browser-like environment
   - Solves DuckDuckGo's anti-abuse challenges

3. **API Bridge Concept**
   - OpenAI-compatible endpoint structure
   - Model listing endpoint
   - Chat completions endpoint
   - Health check endpoint

4. **Core Features**
   - Retry mechanism with exponential backoff
   - Request serialization to prevent rate limiting
   - Prompt folding for system messages and conversation history
   - UTF-8 response handling

### What Was Newly Developed

The following components were newly developed for Vibe.Ai:

1. **Node.js Architecture**
   - Complete rewrite from Python to Node.js
   - ES Modules (ESM) support
   - Async/await pattern throughout

2. **Modular Provider System**
   - Provider interface design
   - DuckAI as the first implemented provider
   - Architecture for future AI providers

3. **Express.js Backend**
   - Full Express.js implementation
   - Middleware for authentication and rate limiting
   - Error handling and logging

4. **Enhanced Features**
   - Optional API key authentication
   - Configurable rate limiting
   - Environment variable configuration
   - Docker and deployment support
   - Comprehensive documentation

5. **Improved Error Handling**
   - Clear error messages for various failure modes
   - Proper HTTP status codes
   - Streaming error handling
   - Upstream failure detection

6. **Testing and Quality**
   - Test suite for endpoints
   - Health check verification
   - Integration testing

## License

Vibe.Ai preserves the original 0BSD license from DuckAI. See [LICENSE](LICENSE) for details.

## Acknowledgments

We would like to express our gratitude to:

- **Revesis** for creating the original DuckAI project and reverse-engineering the DuckDuckGo chat protocol
- **DuckDuckGo** for providing the chat service that makes this possible
- **The open-source community** for the tools and libraries used in this project
- **Mistral AI** for the AI assistance in the migration process

## Contributing

Contributions are welcome! Please see the main [README.md](README.md) for contribution guidelines.

## Legal Notice

Vibe.Ai is an independent project and is not affiliated with, endorsed by, or sponsored by DuckDuckGo, Inc. or any other entity. All trademarks and registered trademarks are the property of their respective owners.

The DuckAI name and protocol implementation are used with permission under the 0BSD license.
