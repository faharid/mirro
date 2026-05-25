import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config/env.config';
import llmConfig from './config/llm.config';
import ragConfig from './config/rag.config';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { LlmModule } from './llm/llm.module';
import { RagModule } from './rag/rag.module';
import { MemoryModule } from './memory/memory.module';
import { AgentsModule } from './agents/agents.module';
import { VoiceModule } from './voice/voice.module';
import { QueueModule } from './queue/queue.module';
import { ClonesModule } from './clones/clones.module';
import { ApiModule } from './api/api.module';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmConfig, ragConfig],
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 60 },
    ]),
    DatabaseModule,
    CacheModule,
    LlmModule,
    RagModule,
    MemoryModule,
    AgentsModule,
    ClonesModule,
    VoiceModule,
    QueueModule,
    ApiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
