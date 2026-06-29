import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EventBus } from 'src/common/event-bus/event-bus.interface';
import { EVENT_BUS } from 'src/common/event-bus/event-bus.tokens';
import {
  Document,
  DocumentStatus,
} from 'src/database/entities/document.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { DocumentUploadedEvent } from './events/document-uploaded.event';

export interface CreateDocumentParams {
  userId: string;
  size: number;
  name: string;
  extension: string;
  mimeType: string;
  key: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  // ==========================================
  // API PÚBLICA (Casos de Uso Principales)
  // ==========================================

  /**
   * Crea un nuevo registro de documento en estado PENDIENTE.
   * Soporta ejecución dentro de una transacción pasando un EntityManager opcional.
   */
  public async create(
    params: CreateDocumentParams,
    manager?: EntityManager,
  ): Promise<Document> {
    const repo = manager
      ? manager.getRepository(Document)
      : this.documentRepository;

    const { userId, size, name, extension, mimeType, key } = params;

    const document = repo.create({
      userId,
      size,
      name,
      extension,
      mimeType,
      status: DocumentStatus.PENDING,
      key,
    });

    return await repo.save(document);
  }

  /**
   * Confirma la subida de un documento, cambia su estado a PROCESSING y dispara el evento en el EventBus.
   */
  public async confirm(userId: string, documentId: string) {
    const document = await this.getPendingDocument(documentId);

    if (!document) {
      throw new BadRequestException(
        'El documente no existe o ya fue eliminado o procesado',
      );
    }

    if (document.userId != userId) {
      throw new ForbiddenException('No tienes acceso a este recurso');
    }

    await this.markAsProccesing(document);

    // que hacer si al publicar el evento falla.

    this.eventBus.publish(
      new DocumentUploadedEvent({ documentId: document.id }),
    );

    return {
      status: 'processing',
      message: 'Tu documento está siendo procesador.',
    };
  }

  /**
   * Valida si un listado de IDs de documentos pertenecen al usuario y están completamente PROCESADOS.
   */
  public async validateDocuments(
    documentIds: string[],
    userId: string,
  ): Promise<boolean> {
    const uniqueIds = [...new Set(documentIds)];

    if (uniqueIds.length === 0) {
      return false;
    }

    const count = await this.documentRepository.count({
      where: {
        id: In(uniqueIds),
        userId: userId,
        status: DocumentStatus.PROCESSED,
      },
    });

    return count === uniqueIds.length;
  }

  // ==========================================
  // MÉTODOS DE MUTACIÓN DE ESTADO
  // ==========================================

  public async markAsProccesing(document: Document) {
    document.markAsProcessing();
    return this.documentRepository.save(document);
  }

  public async markAsCompleted(document: Document, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Document)
      : this.documentRepository;

    document.markAsProcessed();

    return repo.save(document);
  }

  // ==========================================
  // CONSULTAS (Queries de Soporte)
  // ==========================================

  public async getPendingDocument(id: string): Promise<Document | null> {
    return this.documentRepository.findOneBy({
      id,
      status: DocumentStatus.PENDING,
    });
  }

  public async getProcessingDocument(id: string): Promise<Document | null> {
    return this.documentRepository.findOneBy({
      id,
      status: DocumentStatus.PROCESSING,
    });
  }
}
