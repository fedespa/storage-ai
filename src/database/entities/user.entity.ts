import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { Document } from './document.entity';
import { DocumentChunk } from './document-chunk.entity';
import { ChatSession } from './chat-session.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: false })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'password_hash',
    nullable: false,
    select: false,
  })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  role!: UserRole;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => Document, (document) => document.user)
  documents!: Document[];

  @OneToMany(() => DocumentChunk, (chunk) => chunk.user)
  chunks!: DocumentChunk[];

  @OneToMany(() => ChatSession, (session) => session.user)
  chatSessions!: ChatSession[];
}
