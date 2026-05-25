export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  agentId: string;
  messages: ConversationMessage[];
}
