import { DomainEvent } from 'src/common/event-bus/domain-event';

export interface DocumentUploadedPayload {
  documentId: string;
}

export class DocumentUploadedEvent extends DomainEvent<DocumentUploadedPayload> {
  readonly name: string = 'document.uploaded';
}
