import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { ProcessingService } from '../processing.service';
import { DocumentUploadedEvent } from 'src/modules/documents/events/document-uploaded.event';

@Injectable()
export class DocumentUploadedListener {
  constructor(private readonly processingService: ProcessingService) {}

  @OnEvent('document.uploaded')
  async handle(event: DocumentUploadedEvent) {
    await this.processingService.processDocument(event.payload.documentId);
  }
}
