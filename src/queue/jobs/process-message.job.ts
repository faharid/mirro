export const PROCESS_MESSAGE_QUEUE = 'process-message';

export interface ProcessMessageJobData {
  userId: string;
  message: string;
  agentId: string;
  jobId?: string;
}

export interface ProcessMessageJobResult {
  response: string;
  agentId: string;
  userId: string;
  conversationId?: string;
  shouldEscalate?: boolean;
}
