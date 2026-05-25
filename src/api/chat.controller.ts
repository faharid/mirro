import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AgentFactory } from '../agents/agent.factory';
import { QueueService } from '../queue/queue.service';
import { MemoryService } from '../memory/memory.service';
import { ChatDto } from './dto/chat.dto';
import { AgentHandleResult } from '../agents/agent.interface';

function normalizeResponse(
  result: string | AgentHandleResult,
): { response: string; shouldEscalate?: boolean } {
  if (typeof result === 'string') {
    return { response: result };
  }
  return { response: result.text, shouldEscalate: result.shouldEscalate };
}

@Controller()
export class ChatController {
  constructor(
    private readonly agentFactory: AgentFactory,
    private readonly queueService: QueueService,
    private readonly memoryService: MemoryService,
  ) {}

  @Get('conversations')
  listConversations(
    @Query('userId') userId: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.memoryService.listConversations(userId || 'anonymous', agentId);
  }

  @Post('chat')
  async chat(
    @Body() dto: ChatDto,
    @Query('sync') sync?: string,
  ) {
    const agentId = dto.agentId || 'assistant';
    const userId = dto.userId || 'anonymous';

    const conversationId = await this.memoryService.getOrCreateConversationId(
      userId,
      agentId,
    );

    if (sync === 'true') {
      const agent = await this.agentFactory.create(agentId);
      const raw = await agent.handle(dto.message, userId);
      const { response, shouldEscalate } = normalizeResponse(raw);
      return {
        response,
        agentId,
        userId,
        conversationId,
        sync: true,
        shouldEscalate,
      };
    }

    const { jobId } = await this.queueService.addProcessMessage({
      userId,
      message: dto.message,
      agentId,
    });

    return { jobId, status: 'queued', agentId, userId, conversationId };
  }

  @Get('chat/jobs/:jobId')
  async getJobResult(@Param('jobId') jobId: string) {
    const result = await this.queueService.getProcessMessageResult(jobId);
    if (!result) {
      return { jobId, status: 'pending' };
    }
    return { jobId, status: 'completed', ...result };
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    const conversation = await this.memoryService.getConversation(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation not found: ${id}`);
    }
    return conversation;
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string) {
    await this.memoryService.clearConversation(id);
    return { deleted: true, id };
  }
}
