import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmCacheService } from './llm-cache.service';
import { TokenUsageService } from './token-usage.service';

@Module({
  imports: [DatabaseModule],
  providers: [LlmCacheService, TokenUsageService],
  exports: [LlmCacheService, TokenUsageService],
})
export class CacheModule {}
