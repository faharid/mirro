import { ChatMessage } from '../types/message';
import { ToolDefinition } from '../types/tool';
import { ChatResponse } from '../types/response';
import { LlmProviderName } from '../config/models.config';

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

export abstract class BaseLlmProvider {
  abstract readonly name: LlmProviderName;

  abstract chat(options: ChatOptions): Promise<ChatResponse>;

  protected normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter((m) => m.content?.trim());
  }
}
