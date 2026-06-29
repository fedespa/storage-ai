import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Document } from 'src/database/entities/document.entity';
import { User } from './user.entity';

@Entity('document_chunks')
export class DocumentChunk extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'document_id', type: 'uuid', nullable: false })
  documentId!: string;

  @JoinColumn({ name: 'document_id' })
  @ManyToOne(() => Document, (document) => document.chunks)
  document!: Document;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.chunks)
  user!: User;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ name: 'chunk_index', type: 'int', nullable: false })
  chunkIndex!: number;

  @Column({
    name: 'embedding_model',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  embeddingModel!: string;

  @Column({
    type: 'vector',
    length: 1536,
  })
  embedding!: number[];

  @Column({ name: 'parent_id', type: 'uuid', nullable: false })
  parentId!: string;
}
