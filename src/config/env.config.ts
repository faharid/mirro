import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().default(
    'postgresql://postgres:postgres@localhost:5433/ai_agents',
  ),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  OPENAI_API_KEY: Joi.string().optional().allow(''),
  ANTHROPIC_API_KEY: Joi.string().optional().allow(''),
  GOOGLE_API_KEY: Joi.string().optional().allow(''),
  GROQ_API_KEY: Joi.string().optional().allow(''),
  ELEVENLABS_API_KEY: Joi.string().optional().allow(''),
  DEEPGRAM_API_KEY: Joi.string().optional().allow(''),
  SERPAPI_KEY: Joi.string().optional().allow(''),
  DEFAULT_LLM_PROVIDER: Joi.string()
    .valid('openai', 'anthropic', 'google', 'groq')
    .default('openai'),
  DEFAULT_LLM_MODEL: Joi.string().default('gpt-4o-mini'),
  FALLBACK_LLM_PROVIDER: Joi.string()
    .valid('openai', 'anthropic', 'google', 'groq')
    .default('anthropic'),
  FALLBACK_LLM_MODEL: Joi.string().default('claude-3-5-haiku-latest'),
});
