import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RagModule } from '../rag/rag.module';
import { MemoryService } from './memory.service';
import { ConversationStore } from './conversation-store';
import { ContextManager } from './context-manager';

@Module({
  imports: [DatabaseModule, RagModule],
  providers: [MemoryService, ConversationStore, ContextManager],
  exports: [MemoryService, ConversationStore, ContextManager],
})
export class MemoryModule {}
