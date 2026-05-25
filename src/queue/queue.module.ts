import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgentsModule } from '../agents/agents.module';
import { MemoryModule } from '../memory/memory.module';
import { RagModule } from '../rag/rag.module';
import { LlmModule } from '../llm/llm.module';
import { QueueService } from './queue.service';
import { ProcessMessageProcessor } from './processors/process-message.processor';
import { AsyncActionsProcessor } from './processors/async-actions.processor';
import { PROCESS_MESSAGE_QUEUE } from './jobs/process-message.job';
import { ASYNC_ACTIONS_QUEUE } from './jobs/async-actions.job';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
    }),
    BullModule.registerQueue(
      { name: PROCESS_MESSAGE_QUEUE },
      { name: ASYNC_ACTIONS_QUEUE },
    ),
    AgentsModule,
    MemoryModule,
    RagModule,
    LlmModule,
  ],
  providers: [
    QueueService,
    ProcessMessageProcessor,
    AsyncActionsProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
