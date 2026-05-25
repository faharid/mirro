import { Injectable, Optional } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConversationStore } from './conversation-store';
import { ContextManager } from './context-manager';
import { EmbeddingService } from '../rag/embedding.service';
import { MemoryEntry, UserSummary } from './types/memory';
import { MessageEntity } from '../database/entities/message.entity';
import { UserSummaryEntity } from '../database/entities/user-summary.entity';
import { ConversationEntity } from '../database/entities/conversation.entity';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class MemoryService {
  constructor(
    private readonly conversationStore: ConversationStore,
    private readonly contextManager: ContextManager,
    private readonly embeddingService: EmbeddingService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(UserSummaryEntity)
    private readonly summaryRepo: Repository<UserSummaryEntity>,
    @Optional() private readonly queueService?: QueueService,
  ) {}

  async getHistory(
    userId: string,
    options: { limit?: number; agentId?: string } = {},
  ): Promise<MessageEntity[]> {
    const conversation = await this.conversationStore.getOrCreateConversation(
      userId,
      options.agentId || 'assistant',
    );
    return this.conversationStore.getMessages(
      conversation.id,
      options.limit ?? 10,
    );
  }

  async getSimilar(
    message: string,
    options: { limit?: number; userId?: string } = {},
  ): Promise<Array<{ content: string; role: string; score: number }>> {
    try {
      const embedding = await this.embeddingService.embed(message);
      const vectorStr = `[${embedding.join(',')}]`;
      const limit = options.limit ?? 5;

      let query = `
        SELECT m.content, m.role, 1 - (m.embedding <=> $1::vector) AS score
        FROM messages m
        WHERE m.embedding IS NOT NULL
      `;
      const params: unknown[] = [vectorStr];

      if (options.userId) {
        query += ` AND m.conversation_id IN (
          SELECT id FROM conversations WHERE user_id = $2
        )`;
        params.push(options.userId);
      }

      query += ` ORDER BY m.embedding <=> $1::vector LIMIT $${params.length + 1}`;
      params.push(limit);

      const rows = await this.dataSource.query(query, params);
      return rows.map((r: Record<string, unknown>) => ({
        content: r.content as string,
        role: r.role as string,
        score: Number(r.score),
      }));
    } catch {
      return [];
    }
  }

  async getSummary(userId: string): Promise<UserSummary | null> {
    const row = await this.summaryRepo.findOne({ where: { userId } });
    if (!row) return null;
    return { userId: row.userId, summary: row.summary, updatedAt: row.updatedAt };
  }

  async setSummary(userId: string, summary: string): Promise<void> {
    await this.summaryRepo.save({
      userId,
      summary,
      updatedAt: new Date(),
    });
  }

  async getUserMemory(userId: string, agentId?: string): Promise<{
    history: MessageEntity[];
    summary: UserSummary | null;
    similar: Array<{ content: string; role: string; score: number }>;
  }> {
    const history = await this.getHistory(userId, {
      limit: 10,
      agentId: agentId || 'assistant',
    });
    const summary = await this.getSummary(userId);
    const lastUserMsg = history.find((m) => m.role === 'user');
    const similar = lastUserMsg
      ? await this.getSimilar(lastUserMsg.content, { userId, limit: 5 })
      : [];

    return { history, summary, similar };
  }

  async save(
    entry: MemoryEntry & { agentId?: string },
  ): Promise<{ conversationId: string }> {
    const conversation = await this.conversationStore.getOrCreateConversation(
      entry.userId,
      entry.agentId || 'assistant',
    );

    let userEmbedding: number[] | undefined;
    let assistantEmbedding: number[] | undefined;
    try {
      userEmbedding = await this.embeddingService.embed(entry.userMessage);
      assistantEmbedding = await this.embeddingService.embed(
        entry.assistantResponse,
      );
    } catch {
      // embeddings optional
    }

    await this.conversationStore.addMessage(
      conversation.id,
      'user',
      entry.userMessage,
      { timestamp: entry.timestamp },
      userEmbedding,
    );
    await this.conversationStore.addMessage(
      conversation.id,
      'assistant',
      entry.assistantResponse,
      { timestamp: entry.timestamp },
      assistantEmbedding,
    );

    const userMsgCount = await this.conversationStore.countUserMessages(
      conversation.id,
    );
    if (userMsgCount >= 6 && this.queueService) {
      await this.queueService.addAsyncAction({
        type: 'summarize_memory',
        userId: entry.userId,
      });
    }

    return { conversationId: conversation.id };
  }

  async getConversation(id: string) {
    return this.conversationStore.getConversation(id);
  }

  async listConversations(
    userId: string,
    agentId?: string,
  ): Promise<ConversationEntity[]> {
    return this.conversationStore.listByUser(userId, agentId);
  }

  async clearConversation(id: string): Promise<void> {
    await this.conversationStore.deleteConversation(id);
  }

  async getOrCreateConversationId(
    userId: string,
    agentId: string,
  ): Promise<string> {
    const c = await this.conversationStore.getOrCreateConversation(
      userId,
      agentId,
    );
    return c.id;
  }
}
