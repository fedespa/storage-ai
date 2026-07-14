import { Module } from '@nestjs/common';
import { ChunkingService } from './chunking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunk } from 'src/database/entities/document-chunk.entity';
import { ParentDocumentsModule } from '../parent-documents/parent-documents.module';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentChunk]), ParentDocumentsModule],
  providers: [ChunkingService],
  exports: [ChunkingService],
})
export class ChunkingModule {}
