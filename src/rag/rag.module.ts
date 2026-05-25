import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RagService } from './rag.service';
import { DocumentProcessor } from './document-processor';
import { EmbeddingService } from './embedding.service';
import { VectorStore } from './vector-store';
import { Retriever } from './retriever';

@Module({
  imports: [DatabaseModule],
  providers: [
    RagService,
    DocumentProcessor,
    EmbeddingService,
    VectorStore,
    Retriever,
  ],
  exports: [RagService, Retriever, EmbeddingService],
})
export class RagModule {}
