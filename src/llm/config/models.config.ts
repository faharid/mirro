export type LlmProviderName =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq';

export const DEFAULT_MODELS: Record<LlmProviderName, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  google: 'gemini-1.5-flash',
  groq: 'llama-3.3-70b-versatile',
};

export const SUPPORTED_MODELS: Record<LlmProviderName, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: [
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-opus-latest',
  ],
  google: ['gemini-1.5-flash', 'gemini-1.5-pro'],
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ],
};
