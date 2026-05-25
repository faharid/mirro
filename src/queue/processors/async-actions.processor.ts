import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MemoryService } from '../../memory/memory.service';
import { RagService } from '../../rag/rag.service';
import { LlmService } from '../../llm/llm.service';
import {
  ASYNC_ACTIONS_QUEUE,
  AsyncActionsJobData,
} from '../jobs/async-actions.job';

@Processor(ASYNC_ACTIONS_QUEUE)
export class AsyncActionsProcessor extends WorkerHost {
  constructor(
    private readonly memoryService: MemoryService,
    private readonly ragService: RagService,
    private readonly llmService: LlmService,
  ) {
    super();
  }

  async process(job: Job<AsyncActionsJobData>): Promise<unknown> {
    const { type, userId, path, webhookUrl, payload } = job.data;

    switch (type) {
      case 'summarize_memory': {
        if (!userId) return { error: 'userId required' };
        const memory = await this.memoryService.getUserMemory(userId);
        const historyText = memory.history
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n');
        const response = await this.llmService.chat({
          messages: [
            {
              role: 'system',
              content: 'Summarize key facts about this user in 3-5 bullet points.',
            },
            { role: 'user', content: historyText || 'No history yet.' },
          ],
        });
        this.memoryService.setSummary(userId, response.text);
        return { summary: response.text };
      }
      case 'ingest_rag': {
        const result = await this.ragService.ingestLocal(path);
        return result;
      }
      case 'webhook': {
        if (!webhookUrl) return { error: 'webhookUrl required' };
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload || {}),
        });
        return { sent: true };
      }
      default:
        return { error: 'Unknown action type' };
    }
  }
}
