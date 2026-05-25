# ai-clone-kit (mirro)

> Build AI clones and voice agents fast. LLM orchestration + RAG + memory + persona cloning (mirror card).

## Overview

Production-oriented patterns for AI agents and digital personas:

| Area | What you get |
|------|----------------|
| **LLM** | OpenAI, Anthropic, Google, Groq — fallback + retries |
| **RAG** | pgvector knowledge base, upload, ingest, deduplicated embeddings |
| **Memory** | Conversation history, vector recall, Postgres user summaries, auto-summarize |
| **Agents** | Built-in (assistant, support, domain), custom agents, **persona clones** |
| **Tools** | `calculate`, `search`, `http`, `database`, `memory` |
| **Voice** | ElevenLabs, Deepgram, Google TTS + STT |
| **Queue** | BullMQ async chat + background jobs |
| **Web UI** | Next.js app: chat, clones wizard, agents CRUD, knowledge, settings |

### Documentation

**This README is enough to get started** — setup, env vars, API, clones, and production features are all here. A separate `/docs` folder is optional later (e.g. if you add deployment runbooks or ADRs); you do not need it for local dev.

---

## Prerequisites

- **Node.js** 20+
- **Docker** (Postgres pgvector on port **5433**, Redis on **6379**)
- At least one **LLM API key** (OpenAI or Groq recommended for clones/embeddings)

---

## Quick Start

```bash
git clone https://github.com/faharid/ai-clone-kit
cd mirro

# Backend dependencies
npm install

# Infrastructure
docker compose up -d

# Environment (edit with your keys)
cp .env.example .env

# Database (001 + 002: clones, cache, token usage)
npm run migration:run

# API — http://localhost:3001/api
npm run dev
```

### Web UI

```bash
cd web
npm install
cp .env.local.example .env.local   # optional
npm run dev                        # http://localhost:3000
```

From project root (API + web together):

```bash
npm run dev:all
```

The Next.js dev server proxies `/api/*` → `http://localhost:3001`. Open **http://localhost:3000**.

| Page | Route | Features |
|------|-------|----------|
| **Chat** | `/chat` | All agents + active clones, conversation sidebar, sync/async, support escalation banner, mic + TTS |
| **Clones** | `/clones` | Wizard: questionnaire → documents → interview → mirror card → activate |
| **Agents** | `/agents` | Built-in agents, custom agent CRUD, link to chat |
| **Knowledge** | `/knowledge` | Semantic search, file upload, local ingest |
| **Settings** | `/settings` | User ID, token usage, API URL, sync mode, TTS provider |

### Examples (CLI)

```bash
npm run example:assistant
npm run example:support
npm run example:domain
npm run example:voice
npm run example:multi
npm run example:tools
```

---

## Persona Clones / Mirror Card

Build a **digital persona** from three sources, then chat in character.

```mermaid
flowchart LR
  Q[Questionnaire] --> Draft[PersonaClone draft]
  D[Documents] --> Draft
  I[Interview] --> Draft
  Draft --> Card[Mirror card JSON]
  Card --> Agent[agent: clone-uuid]
  Agent --> Chat[Chat API]
```

### UI flow (`/clones`)

1. Create clone (display name)
2. **Questionnaire** — tone, values, phrases, boundaries
3. **Documents** — upload `.txt` / `.md` → LLM personality insights
4. **Interview** — multi-turn interviewer until complete
5. **Review** — generate mirror card (JSON)
6. **Activate** → chat at `/chat?agent=clone-{id}`

### Mirror card shape

```json
{
  "identity": { "name", "archetype", "oneLineBio" },
  "personality": { "traits", "values", "communicationStyle", "humor", "boundaries" },
  "speechPatterns": { "vocabulary", "sentenceStyle", "samplePhrases" },
  "knowledge": { "expertise", "opinions" },
  "interviewHighlights": [],
  "systemPrompt": "..."
}
```

### Clone API

| Method | Route | Description |
|--------|------|-------------|
| `POST` | `/api/clones` | Create draft `{ displayName, userId? }` |
| `GET` | `/api/clones?userId=` | List clones for user |
| `GET` | `/api/clones/:id` | Status + questionnaire / mirror card |
| `PATCH` | `/api/clones/:id/questionnaire` | Save `{ answers, userId? }` |
| `POST` | `/api/clones/:id/documents` | Multipart `file` → insights |
| `POST` | `/api/clones/:id/interview` | `{ message?, userId? }` → interviewer reply |
| `POST` | `/api/clones/:id/generate-mirror-card` | LLM synthesis (Q + docs + interview) |
| `POST` | `/api/clones/:id/activate` | Creates `agent_config`, status `active` |
| `DELETE` | `/api/clones/:id?userId=` | Delete clone |

Requires migration **002**: `npm run migration:run`.

---

## API Reference

Base URL: `http://localhost:3001/api`

### Chat

| Method | Route | Description |
|--------|------|-------------|
| `POST` | `/chat?sync=true` | Sync response (default in UI) |
| `POST` | `/chat` | Async → `{ jobId, conversationId }` |
| `GET` | `/chat/jobs/:jobId` | Poll async result |
| `GET` | `/conversations?userId=&agentId=` | List conversations |
| `GET` | `/conversations/:id` | Conversation + messages |
| `DELETE` | `/conversations/:id` | Clear conversation |

**Body (chat):**

```json
{
  "agentId": "assistant",
  "message": "Hello",
  "userId": "your-user-uuid"
}
```

**Agent IDs:** `assistant` | `support` | `domain` | custom agent `name` | `clone-{uuid}`

**Response (sync):** `{ response, agentId, userId, conversationId, shouldEscalate? }`

### Agents

| Method | Route | Description |
|--------|------|-------------|
| `GET` | `/agents?userId=` | Built-in + custom + active clones |
| `POST` | `/agents` | Create custom agent |
| `GET` | `/agents/:id` | Config (built-in or DB) |
| `PUT` | `/agents/:id` | Update custom agent |
| `DELETE` | `/agents/:id` | Delete custom agent |

### Knowledge

| Method | Route | Description |
|--------|------|-------------|
| `GET` | `/knowledge/search?q=&topK=` | Semantic search |
| `POST` | `/knowledge/upload` | Upload file (multipart) |
| `POST` | `/knowledge/ingest` | Ingest local docs path |

### Voice

| Method | Route | Description |
|--------|------|-------------|
| `POST` | `/voice/synthesize` | TTS → audio blob |
| `POST` | `/voice/transcribe` | STT (multipart audio) |

### Usage

| Method | Route | Description |
|--------|------|-------------|
| `GET` | `/usage?userId=` | Accumulated token count |

### Tools (assistant agent)

| Tool | Purpose |
|------|---------|
| `calculate` | Safe math expressions |
| `search` | Web search (needs `SERPAPI_KEY`) |
| `http` | HTTP GET/POST to allowed URLs |
| `database` | Read-only queries on allowlisted tables |
| `memory` | Similar messages + recent history for user |

---

## Architecture

```
User (Web / API / Voice)
    ↓
ChatController / ClonesController
    ↓
AgentFactory → Assistant | Support | Domain | DynamicAgent | Clone
    ├─ MemoryService (Postgres + pgvector)
    ├─ RagService (optional context)
    ├─ ToolExecutor
    └─ LlmService (cache, fallback, token usage)
    ↓
Queue (BullMQ) optional async path
```

---

## Directory Structure

```
mirro/
├── src/
│   ├── api/                 # chat, agents, clones, knowledge, voice, usage
│   ├── agents/              # base, builtin, dynamic, tool-executor
│   ├── clones/              # mirror card, interview, documents
│   ├── cache/               # LLM cache, token usage
│   ├── llm/                 # providers: openai, anthropic, google, groq
│   ├── rag/                 # embeddings, vector-store, retriever
│   ├── memory/              # conversations, summaries, context
│   ├── voice/               # TTS / STT
│   ├── queue/               # BullMQ processors
│   ├── database/
│   │   ├── entities/        # conversations, clones, cache, usage, …
│   │   └── migrations/      # 001-initial, 002-clones-and-production
│   └── common/              # user throttler, logging interceptor
├── web/                     # Next.js UI
│   └── src/app/
│       ├── chat/
│       ├── clones/
│       ├── agents/
│       ├── knowledge/
│       └── settings/
├── examples/                # 01–06 CLI demos
├── tests/
│   ├── llm.test.ts
│   ├── rag.test.ts
│   ├── agents.test.ts
│   ├── clones.test.ts
│   ├── tools.test.ts
│   └── chat.e2e.test.ts
├── docker-compose.yml       # postgres:5433, redis:6379
├── .env.example
└── README.md
```

---

## Configuration

Copy `.env.example` → `.env`:

```bash
# Server
PORT=3001
NODE_ENV=development

# LLM (at least one required for chat)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...

# Voice (optional)
ELEVENLABS_API_KEY=...
DEEPGRAM_API_KEY=...

# Data stores (defaults match docker-compose)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_agents
REDIS_URL=redis://localhost:6379

# Web search tool (optional)
SERPAPI_KEY=

# Defaults
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4o-mini
FALLBACK_LLM_PROVIDER=anthropic
FALLBACK_LLM_MODEL=claude-3-5-haiku-latest

# Optional production tuning
LLM_CACHE_ENABLED=true
LLM_CACHE_TTL_SECONDS=3600
```

**Headers (direct API clients):**

- `X-User-Id` — rate-limit key (falls back to `userId` in body or IP)
- `X-Token-Budget` — optional max tokens per user (enforced server-side when wired)

---

## Production (implemented vs roadmap)

| Feature | Status |
|---------|--------|
| Per-user rate limiting | Implemented |
| LLM response cache (Redis + `llm_response_cache`) | Implemented |
| HTTP logging interceptor | Implemented |
| Token usage (`user_token_usage`, `GET /api/usage`) | Implemented |
| Embedding dedup on ingest | Implemented |
| LLM fallback provider + retries | Implemented |
| Auto memory summarize (≥6 user messages) | Implemented |
| Support escalation flag in chat | Implemented |
| Domain JSON-style replies (prompt suffix) | Implemented |
| Datadog SDK | Roadmap |
| Encryption at-rest | Roadmap |
| Streaming TTS | Roadmap (batch TTS works) |

---

## Testing

```bash
npm test              # unit: llm, rag, agents, clones, tools, chat e2e
npm run test:e2e      # API smoke (chat.e2e.test.ts)
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `EADDRINUSE :3001` | Stop old API process or change `PORT` |
| DB connection refused | `docker compose up -d`; use port **5433** in `DATABASE_URL` |
| Embeddings fail | Set `OPENAI_API_KEY` (embeddings use OpenAI) |
| Clone tables missing | `npm run migration:run` |
| Web API errors | Ensure API on `:3001`; leave `apiBaseUrl` empty in Settings for proxy |
| Redis errors for queue | Start Redis via docker-compose; sync chat still works |

---

## Next Steps

1. Run **docker compose** + **migrations** + add API keys
2. Open **http://localhost:3000/clones** and build a persona
3. Chat with `clone-{id}` or customize agents via `/agents`
4. Explore `examples/` and extend `src/agents/`

## License

MIT
