import { DocumentStatus } from 'src/database/entities/document.entity';

export class DocumentListItemDto {
  id!: string;
  name!: string;
  extension!: string;
  mimeType!: string;
  size!: number;
  status!: DocumentStatus;
  createdAt!: Date;
}
