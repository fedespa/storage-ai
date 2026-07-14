import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DocumentChunk } from './document-chunk.entity';

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
}

@Entity('documents')
export class Document extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.documents)
  user!: User;

  @Column({ type: 'bigint', nullable: false })
  size!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  extension!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: false })
  mimeType!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  status!: DocumentStatus;

  @Column({ type: 'varchar', length: 255, nullable: false })
  key!: string;

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
  chunks!: DocumentChunk[];

  public isPending(): boolean {
    return this.status === DocumentStatus.PENDING;
  }

  public markAsProcessing() {
    if (!this.isPending()) {
      throw new Error('Transición de estado inválida');
    }

    this.status = DocumentStatus.PROCESSING;
  }

  public markAsProcessed() {
    this.status = DocumentStatus.PROCESSED;
  }
}
