import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../database/entities/conversation.entity';
import { MessageEntity } from '../database/entities/message.entity';

@Injectable()
export class ConversationStore {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
  ) {}

  async getOrCreateConversation(
    userId: string,
    agentId: string,
  ): Promise<ConversationEntity> {
    let conversation = await this.conversationRepo.findOne({
      where: { userId, agentId },
      order: { updatedAt: 'DESC' },
    });

    if (!conversation) {
      conversation = this.conversationRepo.create({ userId, agentId });
      await this.conversationRepo.save(conversation);
    }

    return conversation;
  }

  async getConversation(id: string): Promise<ConversationEntity | null> {
    return this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, unknown>,
    embedding?: number[],
  ): Promise<MessageEntity> {
    const message = this.messageRepo.create({
      conversationId,
      role,
      content,
      metadata,
      embedding: embedding ? `[${embedding.join(',')}]` : null,
    });
    return this.messageRepo.save(message);
  }

  async getMessages(
    conversationId: string,
    limit = 20,
  ): Promise<MessageEntity[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.conversationRepo.delete({ id });
  }

  async listByUser(
    userId: string,
    agentId?: string,
  ): Promise<ConversationEntity[]> {
    return this.conversationRepo.find({
      where: agentId ? { userId, agentId } : { userId },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  }

  async countUserMessages(conversationId: string): Promise<number> {
    return this.messageRepo.count({
      where: { conversationId, role: 'user' },
    });
  }
}
