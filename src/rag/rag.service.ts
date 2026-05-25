import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { DocumentProcessor } from './document-processor';
import { EmbeddingService } from './embedding.service';
import { VectorStore } from './vector-store';
import { Retriever } from './retriever';
import { LoadedDocument } from './knowledge-base/loaders/markdown.loader';
import { loadMarkdown } from './knowledge-base/loaders/markdown.loader';
import { loadPdf } from './knowledge-base/loaders/pdf.loader';
import { loadWeb } from './knowledge-base/loaders/web.loader';

@Injectable()
export class RagService {
  constructor(
    private readonly config: ConfigService,
    private readonly documentProcessor: DocumentProcessor,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStore,
    private readonly retriever: Retriever,
  ) {}

  async loadDocuments(options: {
    source: 'local' | 'web';
    path?: string;
    url?: string;
  }): Promise<LoadedDocument[]> {
    if (options.source === 'web' && options.url) {
      return [await loadWeb(options.url)];
    }

    const basePath =
      options.path ||
      this.config.get<string>('rag.knowledgeBasePath') ||
      'src/rag/knowledge-base/docs';

    const files = await readdir(basePath);
    const documents: LoadedDocument[] = [];

    for (const file of files) {
      const filePath = join(basePath, file);
      const ext = extname(file).toLowerCase();

      if (ext === '.md') {
        documents.push(await loadMarkdown(filePath));
      } else if (ext === '.json') {
        const raw = await readFile(filePath, 'utf-8');
        const faq = JSON.parse(raw) as Array<{ question: string; answer: string }>;
        for (const item of faq) {
          documents.push({
            text: `Q: ${item.question}\nA: ${item.answer}`,
            source: file,
            metadata: { type: 'faq' },
          });
        }
      } else if (ext === '.pdf') {
        documents.push(await loadPdf(filePath));
      }
    }

    return documents;
  }

  chunkDocuments(
    documents: LoadedDocument[],
    options?: { chunkSize?: number; overlap?: number },
  ) {
    return this.documentProcessor.chunkDocuments(documents, options);
  }

  async embedChunks(
    chunks: ReturnType<DocumentProcessor['chunkDocuments']>,
  ): Promise<void> {
    const batchSize = 20;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await this.embeddingService.embedBatch(
        batch.map((c) => c.text),
      );
      await this.vectorStore.insertChunks(batch, embeddings);
    }
  }

  async retrieve(
    query: string,
    options?: { topK?: number; minScore?: number },
  ) {
    return this.retriever.retrieve(query, options);
  }

  async ingestLocal(path?: string): Promise<{ chunks: number }> {
    const documents = await this.loadDocuments({ source: 'local', path });
    const chunks = this.chunkDocuments(documents);
    await this.embedChunks(chunks);
    return { chunks: chunks.length };
  }
}
