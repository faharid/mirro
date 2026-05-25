import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { Repository, LessThan } from 'typeorm';
import { LlmResponseCacheEntity } from '../database/entities/llm-response-cache.entity';
import { ChatResponse } from '../llm/types/response';
import { LlmChatRequest } from '../llm/llm.service';

@Injectable()
export class LlmCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(LlmCacheService.name);
  private redis: Redis | null = null;
  private readonly ttlSeconds: number;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(LlmResponseCacheEntity)
    private readonly cacheRepo: Repository<LlmResponseCacheEntity>,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
      } catch (err) {
        this.logger.warn(`Redis unavailable: ${(err as Error).message}`);
      }
    }
    this.ttlSeconds = Number(this.config.get('LLM_CACHE_TTL_SECONDS') || 3600);
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  hashRequest(request: LlmChatRequest): string {
    const payload = JSON.stringify({
      messages: request.messages,
      model: request.model,
      provider: request.provider,
      temperature: request.temperature,
      tools: request.tools?.map((t) => t.name),
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  async get(hash: string): Promise<ChatResponse | null> {
    if (this.redis) {
      const cached = await this.redis.get(`llm:${hash}`);
      if (cached) {
        try {
          return JSON.parse(cached) as ChatResponse;
        } catch {
          // fall through
        }
      }
    }

    const row = await this.cacheRepo.findOne({ where: { promptHash: hash } });
    if (!row) return null;
    if (row.expiresAt && row.expiresAt < new Date()) {
      await this.cacheRepo.delete({ promptHash: hash });
      return null;
    }

    try {
      return JSON.parse(row.response) as ChatResponse;
    } catch {
      return {
        text: row.response,
        provider: row.provider || 'cache',
        model: row.model || 'cached',
      };
    }
  }

  async set(
    hash: string,
    response: ChatResponse,
    meta?: { provider?: string; model?: string },
  ): Promise<void> {
    const serialized = JSON.stringify(response);
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    if (this.redis) {
      await this.redis.setex(`llm:${hash}`, this.ttlSeconds, serialized);
    }

    await this.cacheRepo.save({
      promptHash: hash,
      response: serialized,
      provider: meta?.provider,
      model: meta?.model,
      usage: response.usage as Record<string, unknown> | undefined,
      expiresAt,
    });
  }

  async pruneExpired(): Promise<void> {
    await this.cacheRepo.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
