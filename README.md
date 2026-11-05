# Vibe.Ai

[![License: 0BSD](https://img.shields.io/badge/License-0BSD-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![GitHub](https://img.shields.io/badge/GitHub-z--7z/Vibe.Ai-informational.svg)](https://github.com/z-7z/Vibe.Ai)

**Vibe.Ai** is a Node.js-based, OpenAI-compatible API bridge for DuckDuckGo's chat service (duck.ai). It's a complete migration and extension of the original [DuckAI](https://github.com/revesis/duckai) project from Python to Node.js.

## Features

- **🚀 Browserless**: No Chrome or browser automation required
- **⚡ Fast**: Pure Node.js implementation with native fetch API
- **🔌 OpenAI-Compatible**: Works with any OpenAI-compatible client
- **📡 Streaming**: Full Server-Sent Events (SSE) support
- **🔐 Optional API Key**: Public or protected mode
- **⚖️ Rate Limiting**: Built-in rate limiting
- **🏗️ Modular Architecture**: Easy to add new AI providers
- **🐳 Docker Ready**: Pre-configured for container deployment

## Installation

### Prerequisites

- Node.js 22+ (recommended: latest LTS version)
- npm or yarn

### Quick Install

```bash
# Clone the repository
git clone https://github.com/z-7z/Vibe.Ai.git
cd Vibe.Ai

# Install dependencies
npm install

# Start the server
npm start
```

### Docker Install

```bash
# Build the Docker image
docker build -t vibe-ai .

# Run the container
docker run -d --name vibe-ai -p 3000:3000 vibe-ai

# With API key
docker run -d --name vibe-ai -p 3000:3000 -e VIBE_API_KEY=your-secret-key vibe-ai
```

## Configuration

Vibe.Ai uses environment variables for configuration. Create a `.env` file or set environment variables directly.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HOST` | 127.0.0.1 | Server host |
| `VIBE_API_KEY` | (empty) | Optional API key for authentication |
| `VIBE_RATE_LIMIT` | 60 | Requests per minute per IP |
| `VIBE_MAX_PROMPT_CHARS` | 15000 | Maximum prompt character limit |
| `VIBE_REQUEST_TIMEOUT` | 180000 | Request timeout in ms (3 minutes) |
| `VIBE_UPSTREAM_MAX_CONCURRENT` | 1 | Max concurrent upstream requests |
| `VIBE_LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `VIBE_CORS_ORIGIN` | * | CORS origin |

### Configuration Examples

**Public Mode (No API Key)**
```bash
# No API key configured = public mode
npm start
```

**Protected Mode (API Key Required)**
```bash
# Set API key
VIBE_API_KEY=your-secret-key npm start

# Or use .env file
echo "VIBE_API_KEY=your-secret-key" > .env
npm start
```

**Custom Port and Rate Limit**
```bash
PORT=8080 VIBE_RATE_LIMIT=120 npm start
```

## API Documentation

### Endpoints

#### Health Check

```
GET /health
GET /healthz
```

Check if the server is running.

**Example:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "upstream": "duck.ai",
  "timestamp": 1700000000,
  "version": "1.0.0",
  "provider": "duckai"
}
```

#### List Models

```
GET /v1/models
GET /models
```

List available models.

**Example:**
```bash
curl http://localhost:3000/v1/models
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-6-luna",
      "object": "model",
      "created": 1700000000,
      "owned_by": "duck.ai",
      "provider": "duckai"
    },
    {
      "id": "gpt-5.6-luna",
      "object": "model",
      "created": 1700000000,
      "owned_by": "duck.ai",
      "provider": "duckai"
    },
    {
      "id": "gpt-5.4-nano",
      "object": "model",
      "created": 1700000000,
      "owned_by": "duck.ai",
      "provider": "duckai"
    },
    {
      "id": "claude-haiku-4-5",
      "object": "model",
      "created": 1700000000,
      "owned_by": "duck.ai",
      "provider": "duckai"
    },
    {
      "id": "mistral-small-2603",
      "object": "model",
      "created": 1700000000,
      "owned_by": "duck.ai",
      "provider": "duckai"
    }
  ]
}
```

#### Chat Completions

```
POST /v1/chat/completions
POST /chat/completions
```

Get chat completions from the AI model.

**Request Body:**
```json
{
  "model": "gpt-6-luna",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 100
}
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | No | gpt-6-luna | Model ID (see available models) |
| `messages` | array | Yes | - | Array of message objects |
| `stream` | boolean | No | false | Whether to stream the response |
| `temperature` | number | No | - | Temperature (not all models support this) |
| `max_tokens` | number | No | - | Maximum tokens (not all models support this) |

**Message Object:**
```json
{
  "role": "system" | "user" | "assistant",
  "content": "string or array"
}
```

**Example (Non-Streaming):**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-6-luna",
    "messages": [{"role": "user", "content": "Say hello"}],
    "stream": false
  }'
```

**Response (Non-Streaming):**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-6-luna",
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

**Example (Streaming):**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "model": "gpt-6-luna",
    "messages": [{"role": "user", "content": "Tell me a story"}],
    "stream": true
  }'
```

**Streaming Response:**
The response will be a stream of Server-Sent Events (SSE). Each event contains a chunk of the response.

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-6-luna","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-6-luna","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-6-luna","choices":[{"index":0,"delta":{"content":" upon"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-6-luna","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Authentication

Vibe.Ai supports optional API key authentication.

**No Authentication (Public Mode):**
```bash
# No API key configured
curl http://localhost:3000/v1/chat/completions ...
```

**Bearer Token Authentication:**
```bash
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3000/v1/chat/completions ...
```

**X-API-Key Header Authentication:**
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/v1/chat/completions ...
```

**Note:** The `/health` endpoint is always accessible, even with API key authentication enabled.

## Available Models

Vibe.Ai currently supports the following models through the DuckAI provider:

| Model ID | Description | Alias |
|----------|-------------|-------|
| `gpt-6-luna` | GPT-6 Luna | luna, gpt-6 |
| `gpt-5.6-luna` | GPT-5.6 Luna | - |
| `gpt-5.4-nano` | GPT-5.4 Nano | nano |
| `gpt-5.4-mini` | GPT-5.4 Mini | mini |
| `claude-haiku-4-5` | Claude Haiku 4.5 | haiku |
| `mistral-small-2603` | Mistral Small 2603 | mistral |

## Provider Architecture

Vibe.Ai is designed with a modular provider architecture, making it easy to add new AI providers in the future.

### Current Provider: DuckAI

The DuckAI provider implements the DuckDuckGo chat protocol:

1. **Bootstrap**: Fetch frontend version from duck.ai
2. **Challenge**: Fetch and solve anti-abuse challenge
3. **Proof**: Build proof header from solved challenge
4. **Chat**: Send chat request with proof

### Adding a New Provider

To add a new provider:

1. Create a new directory under `src/providers/`
2. Implement the required interface:
   - `getModels()` - Return available models
   - `chatCompletion()` - Get a chat completion
   - `streamCompletion()` - Stream a chat completion
3. Register the provider in `src/providers/index.js`

Example structure:
```
src/providers/
  duckai/
    client.js
    challenge.js
    models.js
    index.js
  new-provider/
    client.js
    models.js
    index.js
  index.js
```

## Usage with OpenAI Clients

### Python (openai package)

```python
from openai import OpenAI

# For public mode
client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="anything"  # Ignored in public mode
)

# For protected mode
client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="your-api-key"
)

response = client.chat.completions.create(
    model="gpt-6-luna",
    messages=[{"role": "user", "content": "Hello"}]
)

print(response.choices[0].message.content)
```

### JavaScript (openai package)

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'your-api-key',
});

const response = await openai.chat.completions.create({
  model: 'gpt-6-luna',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: false,
});

console.log(response.choices[0].message.content);
```

### Hermes Agent

```bash
# Configure Hermes
hermes config set model_aliases.vibeai.model gpt-6-luna
hermes config set model_aliases.vibeai.provider custom
hermes config set model_aliases.vibeai.base_url http://localhost:3000/v1
hermes config set model_aliases.vibeai.api_key your-api-key

# Use Vibe.Ai
hermes chat -m vibeai -q "Hello"
```

### Aider

```bash
aider --model vibeai --api-base http://localhost:3000/v1 --api-key your-api-key
```

### Cline

```bash
cline --model vibeai --api-base http://localhost:3000/v1 --api-key your-api-key
```

## Deployment

### Local Development

```bash
# Start the server
npm start

# Or with auto-reload
npm run dev
```

### Docker

```bash
# Build and run
docker build -t vibe-ai .
docker run -d -p 3000:3000 --name vibe-ai vibe-ai

# With environment variables
docker run -d -p 3000:3000 \
  -e VIBE_API_KEY=your-key \
  -e PORT=8080 \
  --name vibe-ai vibe-ai
```

**Docker Compose:**

```yaml
version: '3.8'

services:
  vibe-ai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VIBE_API_KEY=your-secret-key
      - VIBE_RATE_LIMIT=120
      - VIBE_MAX_PROMPT_CHARS=15000
    restart: unless-stopped
```

### Railway

1. Create a new project on [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Set environment variables:
   - `VIBE_API_KEY` (optional)
   - `VIBE_RATE_LIMIT` (optional)
   - `PORT` (set to Railway's port)
4. Deploy

### Render

1. Create a new Web Service on [Render](https://render.com/)
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Vercel (with limitations)

**Note:** Vercel has limitations for persistent streaming servers. The Vibe.Ai server may not work optimally on Vercel's serverless functions.

For best results, use:
- Railway
- Render
- Docker (any platform)
- Self-hosted Node.js server

## Rate Limiting

Vibe.Ai includes built-in rate limiting to prevent abuse:

- **Default**: 60 requests per minute per IP address
- **Configurable**: Set `VIBE_RATE_LIMIT` environment variable
- **Window**: 60 seconds (configurable via `VIBE_RATE_LIMIT_WINDOW`)

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when rate limit resets
- `Retry-After`: Seconds to wait when rate limited

## Error Handling

Vibe.Ai provides clear error messages for various scenarios:

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `invalid_request_error` | 400 | Invalid request parameters |
| `validation_error` | 400 | Request validation failed |
| `authentication_error` | 401 | Missing or invalid API key |
| `rate_limit_error` | 429 | Rate limit exceeded |
| `not_found_error` | 404 | Route not found |
| `upstream_error` | 502 | DuckAI upstream error |
| `server_error` | 500 | Internal server error |

## Project Structure

```
vibe-ai/
├── src/
│   ├── index.js              # Main server entry point
│   ├── config.js             # Configuration management
│   ├── providers/
│   │   ├── index.js          # Provider registry
│   │   └── duckai/
│   │       ├── index.js      # DuckAI provider exports
│   │       ├── client.js     # DuckAI client implementation
│   │       ├── challenge.js  # Challenge solving
│   │       └── models.js     # Model definitions
│   ├── middleware/
│   │   ├── index.js          # Middleware exports
│   │   ├── auth.js           # Authentication middleware
│   │   └── rateLimit.js      # Rate limiting middleware
│   ├── utils/
│   │   ├── index.js          # Utility exports
│   │   ├── prompt.js         # Prompt building utilities
│   │   └── errors.js         # Error handling utilities
│   └── test.js               # Test suite
├── .env.example              # Example environment file
├── .gitignore
├── package.json
├── README.md
├── LICENSE                   # Original 0BSD license
└── CREDITS.md               # Project credits
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -am 'Add some feature'`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/z-7z/Vibe.Ai.git
cd Vibe.Ai

# Install dependencies
npm install

# Install dev dependencies
npm install --save-dev

# Run tests
npm test

# Start development server
npm run dev
```

## License

Vibe.Ai is licensed under the **0BSD (Zero-Clause BSD) License**, the same as the original DuckAI project.

See [LICENSE](LICENSE) for the full license text.

## Credits

- **Original Project**: [DuckAI](https://github.com/revesis/duckai) by [revesis](https://github.com/revesis)
- **Migration & Development**: Mistral AI And Zeox
- **Website**: [https://ai.zeox.xyz](https://ai.zeox.xyz)
- **GitHub**: [https://github.com/z-7z/Vibe.Ai](https://github.com/z-7z/Vibe.Ai)
- **TikTok**: [https://tiktok.com/realzeoxhere](https://tiktok.com/realzeoxhere)

See [CREDITS.md](CREDITS.md) for detailed attribution.

## Disclaimer

Vibe.Ai is an independent project and is not affiliated with, endorsed by, or sponsored by DuckDuckGo, Inc. or any other entity. All trademarks and registered trademarks are the property of their respective owners.

The DuckAI name and protocol implementation are used with permission under the 0BSD license.

## Support

For support, please open an issue on [GitHub](https://github.com/z-7z/Vibe.Ai/issues).

---

**Made By Mistral AI And Zeox**

*Vibe.Ai - Your Node.js gateway to AI chat completions*
