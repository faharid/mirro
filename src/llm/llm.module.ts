import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { OpenaiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import { GroqProvider } from './providers/groq.provider';

@Module({
  providers: [
    LlmService,
    OpenaiProvider,
    AnthropicProvider,
    GoogleProvider,
    GroqProvider,
  ],
  exports: [LlmService],
})
export class LlmModule {}
