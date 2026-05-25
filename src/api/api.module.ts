import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AgentsModule } from '../agents/agents.module';
import { QueueModule } from '../queue/queue.module';
import { MemoryModule } from '../memory/memory.module';
import { VoiceModule } from '../voice/voice.module';
import { RagModule } from '../rag/rag.module';
import { ChatController } from './chat.controller';
import { AgentsController } from './agents.controller';
import { VoiceController } from './voice.controller';
import { KnowledgeController } from './knowledge.controller';

@Module({
  imports: [
    DatabaseModule,
    AgentsModule,
    QueueModule,
    MemoryModule,
    VoiceModule,
    RagModule,
  ],
  controllers: [
    ChatController,
    AgentsController,
    VoiceController,
    KnowledgeController,
  ],
})
export class ApiModule {}
