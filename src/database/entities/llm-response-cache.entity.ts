import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('llm_response_cache')
export class LlmResponseCacheEntity {
  @PrimaryColumn({ name: 'prompt_hash' })
  promptHash!: string;

  @Column({ type: 'text' })
  response!: string;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ type: 'jsonb', nullable: true })
  usage?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;
}
