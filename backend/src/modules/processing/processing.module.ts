import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { DocumentUploadedListener } from './listeners/document.uploaded.listener';
import { DocumentsModule } from '../documents/documents.module';
import { StorageModule } from 'src/common/storage/storage.module';
import { ChunkingModule } from '../chunking/chunking.module';
import { ExtractingModule } from '../extracting/extracting.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ParentDocumentsModule } from '../parent-documents/parent-documents.module';

@Module({
  providers: [DocumentUploadedListener, ProcessingService],
  imports: [
    DocumentsModule,
    StorageModule,
    ChunkingModule,
    ExtractingModule,
    EmbeddingModule,
    ParentDocumentsModule,
  ],
})
export class ProcessingModule {}
