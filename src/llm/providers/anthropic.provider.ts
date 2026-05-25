import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { BaseLlmProvider, ChatOptions } from './base.provider';
import { ChatResponse } from '../types/response';

@Injectable()
export class AnthropicProvider extends BaseLlmProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {
    super();
    const apiKey = this.config.get<string>('llm.anthropicApiKey');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('Anthropic API key not configured');
    }

    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystem = this.normalizeMessages(
      options.messages.filter((m) => m.role !== 'system'),
    );

    const response = await this.client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 1000,
      temperature: options.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: nonSystem.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      tools: options.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: 'object' as const,
          properties: (t.parameters as Record<string, unknown>) || {},
        },
      })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

    return {
      text: textBlock && 'text' in textBlock ? textBlock.text : '',
      toolCalls: toolUseBlocks.map((b) => {
        if (b.type !== 'tool_use') return { id: '', name: '', arguments: {} };
        return {
          id: b.id,
          name: b.name,
          arguments: (b.input as Record<string, unknown>) || {},
        };
      }),
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      provider: this.name,
      model: options.model,
    };
  }
}
