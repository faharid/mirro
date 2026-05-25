import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PROCESS_MESSAGE_QUEUE,
  ProcessMessageJobData,
  ProcessMessageJobResult,
} from './jobs/process-message.job';
import {
  ASYNC_ACTIONS_QUEUE,
  AsyncActionsJobData,
} from './jobs/async-actions.job';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(PROCESS_MESSAGE_QUEUE)
    private readonly processMessageQueue: Queue,
    @InjectQueue(ASYNC_ACTIONS_QUEUE)
    private readonly asyncActionsQueue: Queue,
  ) {}

  async addProcessMessage(
    data: ProcessMessageJobData,
  ): Promise<{ jobId: string }> {
    const job = await this.processMessageQueue.add('process', data, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    return { jobId: job.id || '' };
  }

  async getProcessMessageResult(
    jobId: string,
  ): Promise<ProcessMessageJobResult | null> {
    const job = await this.processMessageQueue.getJob(jobId);
    if (!job) return null;
    if (await job.isCompleted()) {
      return job.returnvalue as ProcessMessageJobResult;
    }
    return null;
  }

  async addAsyncAction(data: AsyncActionsJobData): Promise<{ jobId: string }> {
    const job = await this.asyncActionsQueue.add('action', data);
    return { jobId: job.id || '' };
  }
}
