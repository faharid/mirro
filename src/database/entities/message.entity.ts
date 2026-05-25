import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationEntity;

  @Column()
  role!: 'user' | 'assistant' | 'system';

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'varchar', nullable: true })
  embedding?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
