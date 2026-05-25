import { registerAs } from '@nestjs/config';

export default registerAs('rag', () => ({
  chunkSize: 500,
  chunkOverlap: 100,
  topK: 5,
  minScore: 0.7,
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  knowledgeBasePath: 'src/rag/knowledge-base/docs',
}));
