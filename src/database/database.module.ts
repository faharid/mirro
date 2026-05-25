import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { AgentConfigEntity } from './entities/agent-config.entity';
import { KnowledgeItemEntity } from './entities/knowledge-item.entity';
import { UserSummaryEntity } from './entities/user-summary.entity';
import { PersonaCloneEntity } from './entities/persona-clone.entity';
import { CloneDocumentEntity } from './entities/clone-document.entity';
import { CloneInterviewMessageEntity } from './entities/clone-interview-message.entity';
import { LlmResponseCacheEntity } from './entities/llm-response-cache.entity';
import { UserTokenUsageEntity } from './entities/user-token-usage.entity';

const entities = [
  ConversationEntity,
  MessageEntity,
  AgentConfigEntity,
  KnowledgeItemEntity,
  UserSummaryEntity,
  PersonaCloneEntity,
  CloneDocumentEntity,
  CloneInterviewMessageEntity,
  LlmResponseCacheEntity,
  UserTokenUsageEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities,
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
