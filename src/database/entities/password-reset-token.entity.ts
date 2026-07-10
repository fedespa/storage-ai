import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'expires_at' })
  expiresAt!: Date;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_used',
  })
  isUsed!: boolean;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.passwordResetTokens, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({ type: 'uuid', nullable: false, name: 'user_id' })
  userId!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'token_hash',
    nullable: false,
  })
  tokenHash!: string;

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isUsable(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}