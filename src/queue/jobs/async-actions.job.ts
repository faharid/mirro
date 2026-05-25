export const ASYNC_ACTIONS_QUEUE = 'async-actions';

export type AsyncActionType = 'summarize_memory' | 'ingest_rag' | 'webhook';

export interface AsyncActionsJobData {
  type: AsyncActionType;
  userId?: string;
  path?: string;
  webhookUrl?: string;
  payload?: Record<string, unknown>;
}
