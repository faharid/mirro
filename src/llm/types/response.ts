import { ToolCall } from './tool';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  text: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  provider: string;
  model: string;
}
