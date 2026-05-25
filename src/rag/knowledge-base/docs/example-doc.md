# AI Clone Kit Documentation

## Overview

AI Clone Kit is a production-ready framework for building AI agents with:

- Multi-model LLM orchestration (OpenAI, Anthropic, Google, Groq)
- RAG with pgvector semantic search
- Conversation memory and vector recall
- Voice synthesis via ElevenLabs and Deepgram
- Async job processing with BullMQ

## Getting Started

1. Run `docker compose up -d` for Postgres and Redis
2. Copy `.env.example` to `.env` and add API keys
3. Run `npm run migration:run`
4. Start the server with `npm run dev`

## Support

For billing questions, contact support@example.com.
For technical issues, check the GitHub repository documentation.
