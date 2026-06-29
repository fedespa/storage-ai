import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { DocumentsModule } from '../documents/documents.module';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [StorageModule, DocumentsModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
