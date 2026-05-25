import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { BaseLlmProvider, ChatOptions } from './base.provider';
import { ChatResponse } from '../types/response';

@Injectable()
export class OpenaiProvider extends BaseLlmProvider {
  readonly name = 'openai' as const;
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    super();
    const apiKey = this.config.get<string>('llm.openaiApiKey');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = this.normalizeMessages(options.messages).map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    const tools = options.tools?.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters || { type: 'object', properties: {} },
      },
    }));

    const completion = await this.client.chat.completions.create({
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      tools: tools?.length ? tools : undefined,
    });

    const choice = completion.choices[0];
    const toolCalls = choice.message.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}') as Record<
        string,
        unknown
      >,
    }));

    return {
      text: choice.message.content || '',
      toolCalls,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
      provider: this.name,
      model: options.model,
    };
  }
}
