import { Document } from 'src/database/entities/document.entity';
import { DocumentListItemDto } from './dto/document-list-item.dto';

export function mapDocumentListItem(document: Document): DocumentListItemDto {
  return {
    id: document.id,
    name: document.name,
    extension: document.extension,
    mimeType: document.mimeType,
    size: document.size,
    status: document.status,
    createdAt: document.createdAt,
  };
}
