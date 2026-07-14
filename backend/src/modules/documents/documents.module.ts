import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from 'src/database/entities/document.entity';
import { DocumentsController } from './documents.controller';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), EventBusModule],
  providers: [DocumentsService],
  exports: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
