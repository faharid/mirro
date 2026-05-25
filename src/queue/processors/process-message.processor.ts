import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AgentFactory } from '../../agents/agent.factory';
import { MemoryService } from '../../memory/memory.service';
import { AgentHandleResult } from '../../agents/agent.interface';
import {
  PROCESS_MESSAGE_QUEUE,
  ProcessMessageJobData,
  ProcessMessageJobResult,
} from '../jobs/process-message.job';

function normalizeResponse(
  result: string | AgentHandleResult,
): { response: string; shouldEscalate?: boolean } {
  if (typeof result === 'string') {
    return { response: result };
  }
  return { response: result.text, shouldEscalate: result.shouldEscalate };
}

@Processor(PROCESS_MESSAGE_QUEUE)
export class ProcessMessageProcessor extends WorkerHost {
  constructor(
    private readonly agentFactory: AgentFactory,
    private readonly memoryService: MemoryService,
  ) {
    super();
  }

  async process(
    job: Job<ProcessMessageJobData>,
  ): Promise<ProcessMessageJobResult> {
    const { userId, message, agentId } = job.data;
    const conversationId = await this.memoryService.getOrCreateConversationId(
      userId,
      agentId,
    );
    const agent = await this.agentFactory.create(agentId);
    const raw = await agent.handle(message, userId);
    const { response, shouldEscalate } = normalizeResponse(raw);
    return { response, agentId, userId, conversationId, shouldEscalate };
  }
}
