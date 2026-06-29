import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

export enum ChatRol {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
}

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'chat_session_id', type: 'uuid', nullable: false })
  chatSessionId!: string;

  @JoinColumn({ name: 'chat_session_id' })
  @ManyToOne(() => ChatSession, (session) => session.messages)
  session!: ChatSession;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  role!: ChatRol;
}
