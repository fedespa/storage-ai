import { Module } from '@nestjs/common';
import { ParentDocumentsService } from './parent-documents.service';
import { ParentDocument } from 'src/database/entities/parent-document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ParentDocument])],
  providers: [ParentDocumentsService],
  exports: [ParentDocumentsService],
})
export class ParentDocumentsModule {}
