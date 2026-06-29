import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ChatMessage } from './chat-message.entity';
import { Document } from './document.entity';

@Entity('chat_sessions')
export class ChatSession extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.chatSessions)
  user!: User;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @OneToMany(() => ChatMessage, (message) => message.session, { cascade: true })
  messages!: ChatMessage[];

  @ManyToMany(() => Document)
  @JoinTable({
    name: 'chat_sessions_documents',
    joinColumn: { name: 'chat_session_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'document_id', referencedColumnName: 'id' },
  })
  documents!: Document[];
}
