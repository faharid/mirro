export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}
