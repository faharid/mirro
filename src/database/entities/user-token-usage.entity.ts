import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_token_usage')
export class UserTokenUsageEntity {
  @PrimaryColumn({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'total_tokens', type: 'bigint', default: 0 })
  totalTokens!: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
