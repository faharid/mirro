import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
  defaultModel: process.env.DEFAULT_LLM_MODEL || 'gpt-4o-mini',
  fallbackProvider: process.env.FALLBACK_LLM_PROVIDER || 'anthropic',
  fallbackModel: process.env.FALLBACK_LLM_MODEL || 'claude-3-5-haiku-latest',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
}));
