import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('agent_configs')
export class AgentConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: 'custom' })
  type!: string;

  @Column({ name: 'clone_id', nullable: true })
  cloneId?: string;

  @Column({ name: 'system_prompt', type: 'text' })
  systemPrompt!: string;

  @Column({ type: 'jsonb', default: [] })
  tools!: string[];

  @Column({ default: 'gpt-4o-mini' })
  model!: string;

  @Column({ default: 'openai' })
  provider!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
