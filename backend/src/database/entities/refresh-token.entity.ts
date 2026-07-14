import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'expires_at' })
  expiresAt!: Date;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_revoked',
  })
  isRevoked!: boolean;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
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

  public isRevokedOrExpired(): boolean {
    return this.isRevoked || this.isExpired();
  }
}
