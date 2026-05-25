import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CloneStatus = 'draft' | 'interview' | 'ready' | 'active';

@Entity('persona_clones')
export class PersonaCloneEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ default: 'draft' })
  status!: CloneStatus;

  @Column({ type: 'jsonb', default: {} })
  questionnaire!: Record<string, unknown>;

  @Column({ name: 'mirror_card', type: 'jsonb', nullable: true })
  mirrorCard?: Record<string, unknown>;

  @Column({ name: 'document_insights', type: 'jsonb', default: [] })
  documentInsights!: unknown[];

  @Column({ name: 'interview_complete', default: false })
  interviewComplete!: boolean;

  @Column({ name: 'agent_config_id', nullable: true })
  agentConfigId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
