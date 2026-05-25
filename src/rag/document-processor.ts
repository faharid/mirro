import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoadedDocument } from './knowledge-base/loaders/markdown.loader';

export interface DocumentChunk {
  text: string;
  source: string;
  index: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class DocumentProcessor {
  constructor(private readonly config: ConfigService) {}

  chunkDocuments(
    documents: LoadedDocument[],
    options?: { chunkSize?: number; overlap?: number },
  ): DocumentChunk[] {
    const chunkSize =
      options?.chunkSize ?? this.config.get<number>('rag.chunkSize', 500);
    const overlap =
      options?.overlap ?? this.config.get<number>('rag.chunkOverlap', 100);

    const chunks: DocumentChunk[] = [];

    for (const doc of documents) {
      const text = doc.text.trim();
      if (!text) continue;

      let start = 0;
      let index = 0;
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push({
          text: text.slice(start, end).trim(),
          source: doc.source,
          index,
          metadata: { ...doc.metadata, chunkIndex: index },
        });
        if (end >= text.length) break;
        start = end - overlap;
        index++;
      }
    }

    return chunks.filter((c) => c.text.length > 20);
  }
}
