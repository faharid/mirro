import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { AgentConfigEntity } from './entities/agent-config.entity';
import { KnowledgeItemEntity } from './entities/knowledge-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          ConversationEntity,
          MessageEntity,
          AgentConfigEntity,
          KnowledgeItemEntity,
        ],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      AgentConfigEntity,
      KnowledgeItemEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
