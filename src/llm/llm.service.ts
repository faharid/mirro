import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenaiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import { GroqProvider } from './providers/groq.provider';
import { BaseLlmProvider } from './providers/base.provider';
import { ChatMessage } from './types/message';
import { ToolDefinition } from './types/tool';
import { ChatResponse } from './types/response';
import {
  DEFAULT_MODELS,
  LlmProviderName,
} from './config/models.config';

export interface LlmChatRequest {
  provider?: LlmProviderName;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly providers: Map<LlmProviderName, BaseLlmProvider>;

  constructor(
    private readonly config: ConfigService,
    openai: OpenaiProvider,
    anthropic: AnthropicProvider,
    google: GoogleProvider,
    groq: GroqProvider,
  ) {
    this.providers = new Map<LlmProviderName, BaseLlmProvider>([
      ['openai', openai],
      ['anthropic', anthropic],
      ['google', google],
      ['groq', groq],
    ]);
  }

  async chat(request: LlmChatRequest): Promise<ChatResponse> {
    const provider =
      request.provider ||
      (this.config.get('llm.defaultProvider') as LlmProviderName);
    const model =
      request.model ||
      this.config.get<string>('llm.defaultModel') ||
      DEFAULT_MODELS[provider];

    try {
      return await this.chatWithProvider(provider, model, request);
    } catch (primaryError) {
      this.logger.warn(
        `Primary provider ${provider} failed: ${(primaryError as Error).message}`,
      );
      const fallbackProvider = this.config.get(
        'llm.fallbackProvider',
      ) as LlmProviderName;
      const fallbackModel =
        this.config.get<string>('llm.fallbackModel') ||
        DEFAULT_MODELS[fallbackProvider];

      if (fallbackProvider === provider) {
        throw primaryError;
      }

      return this.chatWithProvider(
        fallbackProvider,
        fallbackModel,
        request,
      );
    }
  }

  private async chatWithProvider(
    providerName: LlmProviderName,
    model: string,
    request: LlmChatRequest,
    retries = 2,
  ): Promise<ChatResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await provider.chat({
          model,
          messages: request.messages,
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          tools: request.tools,
        });
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }
}
