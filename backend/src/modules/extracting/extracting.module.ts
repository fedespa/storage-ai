import { Module } from '@nestjs/common';
import { ExtractingService } from './extracting.service';

@Module({
  imports: [],
  providers: [ExtractingService],
  exports: [ExtractingService],
})
export class ExtractingModule {}
