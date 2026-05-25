import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { VectorStore, VectorSearchResult } from './vector-store';

@Injectable()
export class Retriever {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStore,
    private readonly config: ConfigService,
  ) {}

  async retrieve(
    query: string,
    options?: { topK?: number; minScore?: number },
  ): Promise<VectorSearchResult[]> {
    const embedding = await this.embeddingService.embed(query);
    return this.vectorStore.search(embedding, {
      topK: options?.topK ?? this.config.get<number>('rag.topK', 5),
      minScore:
        options?.minScore ?? this.config.get<number>('rag.minScore', 0.7),
    });
  }
}
