import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { createHash } from 'crypto';

@Injectable()
export class EmbeddingService {
  private client: OpenAI | null = null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('llm.openaiApiKey') || process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
    this.model =
      this.config.get<string>('rag.embeddingModel') || 'text-embedding-3-small';
  }

  hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  async embed(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('OpenAI API key required for embeddings');
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });

    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error('OpenAI API key required for embeddings');
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  }
}
