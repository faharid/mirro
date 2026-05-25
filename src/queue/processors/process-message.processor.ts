import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AgentFactory } from '../../agents/agent.factory';
import {
  PROCESS_MESSAGE_QUEUE,
  ProcessMessageJobData,
  ProcessMessageJobResult,
} from '../jobs/process-message.job';

@Processor(PROCESS_MESSAGE_QUEUE)
export class ProcessMessageProcessor extends WorkerHost {
  constructor(private readonly agentFactory: AgentFactory) {
    super();
  }

  async process(
    job: Job<ProcessMessageJobData>,
  ): Promise<ProcessMessageJobResult> {
    const { userId, message, agentId } = job.data;
    const agent = this.agentFactory.create(agentId);
    const response = await agent.handle(message, userId);
    return { response, agentId, userId };
  }
}
