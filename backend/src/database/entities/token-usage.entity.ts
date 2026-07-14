import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ChatModelInteractionType {
  QUERY_REFORMULATION = 'query_reformulation',
  GROUNDED_ANSWER = 'grounded_answer',
}

@Entity('token_usage')
export class TokenUsage extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User)
  user!: User;

  @Column({ name: 'prompt_tokens', type: 'integer', nullable: false })
  promptTokens!: number;

  @Column({ name: 'completion_tokens', type: 'integer', nullable: false })
  completionTokens!: number;

  @Column({ name: 'total_tokens', type: 'integer', nullable: false })
  totalTokens!: number;

  @Column({ name: 'model_name', type: 'varchar', length: 255, nullable: false })
  modelName!: string;

  @Column({
    name: 'interaction_type',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  interactionType!: ChatModelInteractionType;
}
