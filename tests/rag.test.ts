import { DocumentProcessor } from '../src/rag/document-processor';
import { ConfigService } from '@nestjs/config';

describe('RAG module', () => {
  const mockConfig = {
    get: (key: string, defaultValue?: unknown) => {
      const map: Record<string, unknown> = {
        'rag.chunkSize': 100,
        'rag.chunkOverlap': 20,
      };
      return map[key] ?? defaultValue;
    },
  } as unknown as ConfigService;

  const processor = new DocumentProcessor(mockConfig);

  it('should chunk documents with overlap', () => {
    const chunks = processor.chunkDocuments([
      {
        text: 'A'.repeat(250),
        source: 'test.md',
      },
    ]);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].source).toBe('test.md');
    expect(chunks[0].text.length).toBeLessThanOrEqual(100);
  });

  it('should filter empty chunks', () => {
    const chunks = processor.chunkDocuments([
      { text: 'short', source: 'tiny.md' },
    ]);
    expect(chunks.length).toBe(0);
  });
});
