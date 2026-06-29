import { Module } from '@nestjs/common';
import { S3StorageService } from './implementations/s3.service';

export const STORAGE_SERVICE_TOKEN = 'STORAGE_SERVICE_TOKEN';

@Module({
  providers: [
    {
      provide: STORAGE_SERVICE_TOKEN,
      useClass: S3StorageService,
    },
  ],
  exports: [STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
