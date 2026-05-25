import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_summaries')
export class UserSummaryEntity {
  @PrimaryColumn({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'text' })
  summary!: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
