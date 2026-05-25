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

@Controller()
export class ChatController {
  constructor(
    private readonly agentFactory: AgentFactory,
    private readonly queueService: QueueService,
    private readonly memoryService: MemoryService,
  ) {}

  @Post('chat')
  async chat(
    @Body() dto: ChatDto,
    @Query('sync') sync?: string,
  ) {
    const agentId = dto.agentId || 'assistant';
    const userId = dto.userId || 'anonymous';

    if (sync === 'true') {
      const agent = this.agentFactory.create(agentId);
      const response = await agent.handle(dto.message, userId);
      return { response, agentId, userId, sync: true };
    }

    const { jobId } = await this.queueService.addProcessMessage({
      userId,
      message: dto.message,
      agentId,
    });

    return { jobId, status: 'queued', agentId, userId };
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
