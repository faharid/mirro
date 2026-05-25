export interface MemoryEntry {
  userId: string;
  userMessage: string;
  assistantResponse: string;
  timestamp: Date;
  conversationId?: string;
}

export interface UserSummary {
  userId: string;
  summary: string;
  updatedAt: Date;
}
