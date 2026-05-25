import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RagModule } from '../rag/rag.module';
import { QueueModule } from '../queue/queue.module';
import { MemoryService } from './memory.service';
import { ConversationStore } from './conversation-store';
import { ContextManager } from './context-manager';

@Module({
  imports: [DatabaseModule, RagModule, forwardRef(() => QueueModule)],
  providers: [MemoryService, ConversationStore, ContextManager],
  exports: [MemoryService, ConversationStore, ContextManager],
})
export class MemoryModule {}
