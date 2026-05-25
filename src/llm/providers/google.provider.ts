import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLlmProvider, ChatOptions } from './base.provider';
import { ChatResponse } from '../types/response';

@Injectable()
export class GoogleProvider extends BaseLlmProvider {
  readonly name = 'google' as const;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly config: ConfigService) {
    super();
    const apiKey = this.config.get<string>('llm.googleApiKey');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    if (!this.genAI) {
      throw new Error('Google API key not configured');
    }

    const model = this.genAI.getGenerativeModel({ model: options.model });
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const userMessages = this.normalizeMessages(
      options.messages.filter((m) => m.role !== 'system'),
    );

    const prompt = [
      systemMessage ? `System: ${systemMessage.content}` : '',
      ...userMessages.map((m) => `${m.role}: ${m.content}`),
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1000,
      },
    });

    const text = result.response.text();

    return {
      text,
      provider: this.name,
      model: options.model,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }
}
