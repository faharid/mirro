import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AgentsModule } from '../agents/agents.module';
import { QueueModule } from '../queue/queue.module';
import { MemoryModule } from '../memory/memory.module';
import { VoiceModule } from '../voice/voice.module';
import { RagModule } from '../rag/rag.module';
import { ClonesModule } from '../clones/clones.module';
import { CacheModule } from '../cache/cache.module';
import { ChatController } from './chat.controller';
import { AgentsController } from './agents.controller';
import { VoiceController } from './voice.controller';
import { KnowledgeController } from './knowledge.controller';
import { ClonesController } from './clones.controller';
import { UsageController } from './usage.controller';

@Module({
  imports: [
    DatabaseModule,
    AgentsModule,
    QueueModule,
    MemoryModule,
    VoiceModule,
    RagModule,
    ClonesModule,
    CacheModule,
  ],
  controllers: [
    ChatController,
    AgentsController,
    VoiceController,
    KnowledgeController,
    ClonesController,
    UsageController,
  ],
})
export class ApiModule {}
