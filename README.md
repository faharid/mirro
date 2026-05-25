# ai-clone-kit

> Build AI clones and voice agents fast. LLM orchestration + RAG + voice synthesis. Perfect for chatbots, customer support agents, or personal AI assistants.

## Overview

Production patterns for AI agents and clones. Everything you need to build intelligent systems:
- **LLM Orchestration:** Multi-model support (OpenAI, Claude, Anthropic, Google, Groq)
- **RAG (Retrieval-Augmented Generation):** Knowledge base + semantic search
- **Memory Management:** Vector DB + conversation history
- **Voice:** Text-to-speech integration (ElevenLabs/Deepgram)
- **Job Queue:** Async task orchestration (BullMQ)
- **Examples:** Personal assistant, customer support bot, domain-specific agents

## Quick Start

```bash
# Clone
git clone https://github.com/faharid/ai-clone-kit
cd mirro

# Install
npm install

# Configure
cp .env.example .env
# Add your LLM API keys (OpenAI, Claude, etc.)

# Run examples
npm run example:assistant       # Personal AI assistant
npm run example:support        # Customer support chatbot
npm run example:domain         # Domain-specific expert

# Start server
npm run dev

# API: http://localhost:3001
```

## Web UI

Full Next.js interface in [`web/`](web/) (chat, agents, knowledge base, voice, settings).

```bash
# Terminal 1 — API (from project root)
docker compose up -d
npm run migration:run   # first time only
npm run dev             # http://localhost:3001/api

# Terminal 2 — Frontend
cd web
cp .env.local.example .env.local   # optional
npm install
npm run dev             # http://localhost:3000
```

Or run both from the project root:

```bash
npm run dev:all
```

The dev server proxies `/api/*` to the Nest backend. Open **http://localhost:3000** for the UI (English).

| Page | Route | Features |
|------|-------|----------|
| Chat | `/chat` | All agents + clones, API conversation list, sync/async, escalation banner, mic + TTS |
| Clones | `/clones` | Persona wizard: questionnaire, documents, interview, mirror card, activate |
| Agents | `/agents` | Built-in + custom CRUD, clone agents, start chat |
| Knowledge | `/knowledge` | Search, upload, ingest (embedding dedup) |
| Settings | `/settings` | User ID, token usage, API URL, sync mode, TTS provider |

## Persona Clones / Mirror Card

Create a digital persona from three inputs:

1. **Questionnaire** — structured profile (tone, values, phrases, boundaries)
2. **Documents** — upload `.txt`/`.md`; LLM extracts personality insights
3. **Interview** — multi-turn interviewer agent until `[INTERVIEW_COMPLETE]`

**Generate mirror card** fuses all sources into JSON (`identity`, `personality`, `speechPatterns`, `knowledge`, `systemPrompt`). **Activate** creates an `agent_config` and chat via `agentId: clone-{uuid}`.

### Clone API

| Method | Route | Description |
|--------|------|-------------|
| POST | `/api/clones` | Create draft `{ displayName, userId }` |
| GET | `/api/clones?userId=` | List clones |
| GET | `/api/clones/:id` | Status + partial mirror card |
| PATCH | `/api/clones/:id/questionnaire` | Save answers |
| POST | `/api/clones/:id/documents` | Upload file → insights |
| POST | `/api/clones/:id/interview` | Interview turn |
| POST | `/api/clones/:id/generate-mirror-card` | Synthesize mirror card |
| POST | `/api/clones/:id/activate` | Create agent + status `active` |
| DELETE | `/api/clones/:id` | Remove clone |

Run migration `002` before using clones: `npm run migration:run`.

## Architecture

```
Input (User message / Voice)
    ↓
Conversation Handler
    ├─ Memory retrieval (vector DB)
    ├─ Context enrichment
    └─ RAG retrieval if needed
    ↓
LLM Agent
    ├─ Choose model (GPT-4, Claude, etc.)
    ├─ System prompt
    ├─ Tool calling (if configured)
    └─ Generate response
    ↓
Post-processing
    ├─ Memory storage
    ├─ Voice synthesis (optional)
    └─ Response formatting
    ↓
Output (Text / Voice / Webhook)
```

## Directory Structure

```
ai-clone-kit/
├── src/
│   ├── main.ts                          # Entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── llm/
│   │   ├── llm.module.ts
│   │   ├── llm.service.ts               # Main LLM client wrapper
│   │   ├── providers/
│   │   │   ├── openai.provider.ts       # OpenAI/GPT-4
│   │   │   ├── anthropic.provider.ts    # Claude
│   │   │   ├── google.provider.ts       # Gemini (optional)
│   │   │   ├── groq.provider.ts         # Groq (Llama, Mixtral, fast inference)
│   │   │   └── base.provider.ts         # Abstract base class
│   │   ├── types/
│   │   │   ├── message.ts
│   │   │   ├── tool.ts
│   │   │   └── response.ts
│   │   └── config/
│   │       └── models.config.ts
│   │
│   ├── rag/
│   │   ├── rag.module.ts
│   │   ├── rag.service.ts               # RAG orchestration
│   │   ├── document-processor.ts        # Chunk documents
│   │   ├── embedding.service.ts         # Generate embeddings
│   │   ├── vector-store.ts              # pgvector/Pinecone wrapper
│   │   ├── retriever.ts                 # Semantic search
│   │   └── knowledge-base/
│   │       ├── docs/
│   │       │   ├── example-doc.md
│   │       │   └── faq.json
│   │       └── loaders/
│   │           ├── pdf.loader.ts
│   │           ├── markdown.loader.ts
│   │           └── web.loader.ts
│   │
│   ├── clones/                          # Persona clones + mirror card
│   │   ├── clones.service.ts
│   │   ├── mirror-card.service.ts
│   │   ├── clone-interview.service.ts
│   │   └── clone-document.service.ts
│   ├── cache/
│   │   ├── llm-cache.service.ts
│   │   └── token-usage.service.ts
│   ├── agents/
│   │   ├── agents.module.ts
│   │   ├── agent.factory.ts             # Built-in, custom, clone-* agents
│   │   ├── dynamic-agent.ts
│   │   ├── agent.interface.ts           # Agent contract
│   │   ├── base-agent.ts                # Abstract base agent
│   │   ├── assistant-agent.ts           # Personal assistant
│   │   ├── support-agent.ts             # Customer support
│   │   ├── domain-agent.ts              # Domain-specific expert
│   │   ├── tools/
│   │   │   ├── tool-executor.ts         # calculate, search, http, database, memory
│   │   │   ├── web-search.tool.ts
│   │   │   ├── calculator.tool.ts
│   │   │   ├── database.tool.ts
│   │   │   └── http.tool.ts
│   │   └── system-prompts/
│   │       ├── assistant.prompt
│   │       ├── support.prompt
│   │       └── domain.prompt
│   │
│   ├── memory/
│   │   ├── memory.module.ts
│   │   ├── memory.service.ts            # Conversation + vector memory
│   │   ├── conversation-store.ts        # Store conversations (DB)
│   │   ├── context-manager.ts           # Build context for LLM
│   │   └── types/
│   │       ├── conversation.ts
│   │       └── memory.ts
│   │
│   ├── voice/
│   │   ├── voice.module.ts
│   │   ├── tts.service.ts               # Text-to-speech
│   │   ├── providers/
│   │   │   ├── elevenlabs.provider.ts   # ElevenLabs
│   │   │   ├── deepgram.provider.ts     # Deepgram
│   │   │   └── google.provider.ts       # Google Cloud
│   │   └── stt.service.ts               # Speech-to-text (optional)
│   │
│   ├── queue/
│   │   ├── queue.module.ts
│   │   ├── queue.service.ts             # BullMQ wrapper
│   │   └── jobs/
│   │       ├── process-message.job.ts   # Main processing job
│   │       └── async-actions.job.ts     # Background tasks
│   │
│   ├── api/
│   │   ├── chat.controller.ts           # Chat endpoint
│   │   ├── agents.controller.ts         # Agent management
│   │   ├── voice.controller.ts          # Voice input/output
│   │   └── dto/
│   │       ├── chat.dto.ts
│   │       └── agent.dto.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── entities/
│   │   │   ├── conversation.entity.ts
│   │   │   ├── message.entity.ts
│   │   │   ├── agent-config.entity.ts
│   │   │   └── knowledge-item.entity.ts
│   │   └── migrations/
│   │       └── 001-initial.ts
│   │
│   └── config/
│       ├── env.config.ts
│       ├── llm.config.ts
│       └── rag.config.ts
│
├── examples/
│   ├── 01-personal-assistant.ts          # AI that learns about you
│   ├── 02-support-bot.ts                 # Customer support chatbot
│   ├── 03-domain-expert.ts               # Domain-specific knowledge bot
│   ├── 04-voice-agent.ts                 # Voice input/output
│   ├── 05-multi-agent.ts                 # Multiple specialized agents
│   └── 06-tools-integration.ts           # Agents with external tools
│
├── tests/
│   ├── llm.test.ts
│   ├── rag.test.ts
│   ├── agents.test.ts
│   └── e2e.test.ts
│
├── docker-compose.yml                    # pgvector, redis
├── package.json
├── .env.example
└── README.md (this file)
```

## Core Features Explained

### 1. LLM Orchestration

Support multiple models with unified interface:

```typescript
// llm/llm.service.ts
const response = await this.llmService.chat({
  provider: 'openai',        // or 'anthropic', 'google', 'groq'
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  temperature: 0.7,
  maxTokens: 1000,
  tools: [
    { name: 'search', description: 'Search the web' },
    { name: 'calculate', description: 'Perform calculations' }
  ]
});

// Response includes
// - response.text (generated text)
// - response.toolCalls (if model chose tools)
// - response.usage (token counts)
```

### 2. RAG (Retrieval-Augmented Generation)

Add knowledge without fine-tuning:

```typescript
// 1. Load documents
const documents = await this.ragService.loadDocuments({
  source: 'local',
  path: './knowledge-base/docs'
});

// 2. Split into chunks
const chunks = await this.ragService.chunkDocuments(documents, {
  chunkSize: 500,
  overlap: 100
});

// 3. Generate embeddings
await this.ragService.embedChunks(chunks);

// 4. Retrieve relevant context
const context = await this.ragService.retrieve(userQuery, {
  topK: 5,
  minScore: 0.8
});

// 5. Add to LLM prompt
const enrichedPrompt = `
You are a helpful assistant. Use this context:
${context.map(c => c.text).join('\n')}

User question: ${userQuery}
`;
```

### 3. Agent Framework

Define agents with system prompts + tools:

```typescript
// agents/assistant-agent.ts
export class AssistantAgent extends BaseAgent {
  constructor(
    private llmService: LLMService,
    private memoryService: MemoryService,
    private ragService: RAGService
  ) {
    super('assistant');
  }

  systemPrompt = `You are a helpful personal AI assistant.
    You have access to:
    - User's past conversations (memory)
    - Knowledge base
    - Web search
    - Calculator
    
    Be conversational, helpful, and remember context.`;

  tools = [
    { name: 'search', description: 'Search the web' },
    { name: 'memory', description: 'Recall past conversations' },
    { name: 'calculate', description: 'Perform math' }
  ];

  async handle(message: string, userId: string): Promise<string> {
    // 1. Get user memory
    const memory = await this.memoryService.getUserMemory(userId);

    // 2. Retrieve RAG context if needed
    let context = '';
    if (this.isKnowledgeQuestion(message)) {
      const docs = await this.ragService.retrieve(message);
      context = docs.map(d => d.text).join('\n');
    }

    // 3. Build prompt
    const prompt = `${this.systemPrompt}
      
User memory:
${JSON.stringify(memory, null, 2)}

${context ? `Relevant knowledge:\n${context}` : ''}

User: ${message}`;

    // 4. Call LLM
    const response = await this.llmService.chat({
      provider: 'openai',
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });

    // 5. Store in memory
    await this.memoryService.save({
      userId,
      userMessage: message,
      assistantResponse: response.text,
      timestamp: new Date()
    });

    return response.text;
  }
}
```

### 4. Memory Management

Store conversation + vector memory:

```typescript
// memory/memory.service.ts
// Vector memory: semantic search over conversations
const recentContext = await this.memoryService.getSimilar(
  userMessage,
  { limit: 5 }
);

// Conversation history: last N messages
const history = await this.memoryService.getHistory(userId, {
  limit: 10
});

// Summary memory: extract facts about user
const summary = await this.memoryService.getSummary(userId);
```

### 5. Voice Support

Text-to-speech and speech-to-text:

```typescript
// voice/tts.service.ts
const audioBuffer = await this.ttsService.synthesize({
  text: 'Hello, how can I help?',
  provider: 'elevenlabs',
  voiceId: 'natural-female-001',
  language: 'en'
});

// Send as audio file / stream
res.contentType('audio/mpeg');
res.send(audioBuffer);
```

### 6. Async Job Processing

Handle long-running tasks with BullMQ:

```typescript
// queue/queue.service.ts
// Add job to queue
await this.queueService.add('process-message', {
  userId,
  message,
  agentType: 'support'
});

// Worker processes async
@Process('process-message')
async handleMessage(job: Job<MessageJob>) {
  const { userId, message, agentType } = job.data;
  const agent = this.agentFactory.create(agentType);
  const response = await agent.handle(message, userId);
  // Store result, send webhook, etc.
}
```

## API Endpoints

### Chat (Main)
- `POST /api/chat` - Send message to agent
  ```json
  { "agentId": "assistant", "message": "Hello!" }
  ```
- `GET /api/conversations/:id` - Get conversation history
- `DELETE /api/conversations/:id` - Clear conversation

### Agents
- `GET /api/agents` - List available agents
- `POST /api/agents` - Create custom agent
- `GET /api/agents/:id` - Get agent config
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Voice
- `POST /api/voice/synthesize` - Text-to-speech
  ```json
  { "text": "Hello world", "voice": "natural-female" }
  ```
- `POST /api/voice/transcribe` - Speech-to-text (audio file upload)

### Knowledge Base
- `POST /api/knowledge/upload` - Upload document
- `GET /api/knowledge/search` - Search knowledge base
- `POST /api/knowledge/ingest` - Process and embed documents

## Examples Included

### 1. Personal Assistant
```bash
npm run example:assistant

# Features:
# - Remembers conversation history
# - Learns user preferences
# - Can search web and perform tasks
```

### 2. Customer Support Bot
```bash
npm run example:support

# Features:
# - Handles common questions from KB
# - Escalates to humans when needed
# - Tracks support tickets
# - Multi-language support
```

### 3. Domain Expert
```bash
npm run example:domain

# Features:
# - Specialized knowledge (finance, legal, technical)
# - Cites sources from knowledge base
# - Structured outputs (JSON, tables)
```

### 4. Voice Agent
```bash
npm run example:voice

# Features:
# - Speech-to-text input
# - Voice output responses
# - Streaming audio
```

### 5. Multi-Agent System
Multiple specialized agents working together:
- Coordinator picks best agent
- Agents can delegate to each other
- Shared memory/context

## Configuration

### Environment Variables

```bash
# .env
# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...

# Voice
ELEVENLABS_API_KEY=...
DEEPGRAM_API_KEY=...

# Database
DATABASE_URL=postgresql://localhost/ai_agents

# Vector DB
PGVECTOR_URL=postgresql://localhost/pgvector

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Optional: Datadog
DATADOG_API_KEY=...
```

### Switch LLM Providers

```typescript
// Just update config
const response = await this.llmService.chat({
  provider: 'anthropic',  // Switch from OpenAI to Claude
  model: 'claude-3-opus',
  messages: [...]
});
```

## Testing

```bash
# Run tests
npm test

# E2E tests
npm run test:e2e

# Examples:
# - Chat flow with memory
# - RAG retrieval
# - Tool calling
# - Multi-agent coordination
```

## Production (implemented vs roadmap)

| Feature | Status |
|---------|--------|
| Per-user rate limiting (`UserThrottlerGuard`, `X-User-Id`) | Implemented |
| LLM response cache (Redis + Postgres `llm_response_cache`) | Implemented |
| HTTP request logging (`LoggingInterceptor`) | Implemented |
| Token usage tracking (`user_token_usage`, `GET /api/usage`) | Implemented |
| Embedding dedup on ingest (`contentHash` in metadata) | Implemented |
| Fallback LLM provider + retries | Implemented |
| Auto memory summarize (≥6 user messages → BullMQ) | Implemented |
| Datadog SDK | Roadmap |
| Encryption at-rest for user data | Roadmap |
| Streaming TTS (`Accept: audio/stream`) | Roadmap (batch TTS works) |

## Next Steps

1. **Understand architecture:** Read examples/
2. **Set up locally:** docker-compose + npm install
3. **Try examples:** npm run example:*
4. **Build your agent:** Copy a base agent, customize

## License

MIT

---

**AI agents for startups. Multi-model. Production-ready. No hallucinations about your capabilities.**
