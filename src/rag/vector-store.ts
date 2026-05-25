import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DocumentChunk } from './document-processor';

export interface VectorSearchResult {
  id: string;
  text: string;
  source?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class VectorStore {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insertChunks(
    chunks: DocumentChunk[],
    embeddings: number[][],
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const vectorStr = `[${embedding.join(',')}]`;

      await this.dataSource.query(
        `INSERT INTO knowledge_items (content, source, metadata, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [
          chunk.text,
          chunk.source,
          JSON.stringify(chunk.metadata || {}),
          vectorStr,
        ],
      );
    }
  }

  async search(
    queryEmbedding: number[],
    options: { topK?: number; minScore?: number } = {},
  ): Promise<VectorSearchResult[]> {
    const topK = options.topK ?? 5;
    const minScore = options.minScore ?? 0.7;
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    const rows = await this.dataSource.query(
      `SELECT id, content, source, metadata,
              1 - (embedding <=> $1::vector) AS score
       FROM knowledge_items
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, topK],
    );

    return rows
      .filter((r: { score: number }) => r.score >= minScore)
      .map((r: Record<string, unknown>) => ({
        id: r.id as string,
        text: r.content as string,
        source: r.source as string | undefined,
        score: Number(r.score),
        metadata:
          typeof r.metadata === 'string'
            ? JSON.parse(r.metadata)
            : (r.metadata as Record<string, unknown>),
      }));
  }

  async deleteBySource(source: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM knowledge_items WHERE source = $1`,
      [source],
    );
  }
}
