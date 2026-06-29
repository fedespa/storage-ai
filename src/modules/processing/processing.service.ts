import { Inject, Injectable } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import {
  Document,
  DocumentStatus,
} from 'src/database/entities/document.entity';
import type { StorageInterface } from 'src/common/storage/storage.interface';
import { STORAGE_SERVICE_TOKEN } from 'src/common/storage/storage.module';
import { fileTypeFromStream } from 'file-type';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { ChunkingService } from '../chunking/chunking.service';
import { ExtractingService } from '../extracting/extracting.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { DataSource } from 'typeorm';
import { ParentDocumentsService } from '../parent-documents/parent-documents.service';

@Injectable()
export class ProcessingService {
  constructor(
    private readonly documentService: DocumentsService,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: StorageInterface,
    private readonly chunkingService: ChunkingService,
    private readonly extractingService: ExtractingService,
    private readonly embeddingService: EmbeddingService,
    private readonly dataSource: DataSource,
    private readonly parentDocumentService: ParentDocumentsService,
  ) {}

  // ==========================================
  // API PÚBLICA
  // ==========================================

  /**
   * Orquesta el flujo completo de procesamiento de un documento:
   * Validación de seguridad, descarga, extracción de texto, chunking e indexación (Embeddings).
   */
  public async processDocument(documentId: string) {
    const document =
      await this.documentService.getProcessingDocument(documentId);

    if (!document || document.status !== DocumentStatus.PROCESSING) return;

    await this.verifyFileSignature(document);

    const tempPath = await this.downloadAndValidateSize(document);

    try {
      const documents = await this.extractingService.extractText(tempPath);

      const { parentNodes, childNodes } =
        this.chunkingService.processAndStoreHierarchicalNodes(documents);

      const embeddings =
        await this.embeddingService.generateEmbeddingsForNodes(childNodes);

      await this.dataSource.transaction(async (manager) => {
        await this.documentService.markAsCompleted(document, manager);
        await this.parentDocumentService.saveParentDocuments(parentNodes);
        await this.chunkingService.saveChunks(
          embeddings,
          document.id,
          document.userId,
          manager,
        );
      });
    } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS DE VALIDACIÓN Y FLUJO
  // ==========================================

  /**
   * Compara explícitamente la extensión y el MIME type detectados.
   */
  private validateType(
    document: Document,
    fileInfo: { ext: string; mime: string },
  ) {
    if (
      fileInfo.ext != document.extension.replace(/^\./, '') ||
      fileInfo.mime != document.mimeType
    ) {
      throw new Error('Archivo inválido');
    }
  }

  /**
   * Verifica los "Magic Bytes" reales del archivo contra los metadatos registrados.
   */
  private async verifyFileSignature(document: Document): Promise<void> {
    const fileStream = await this.storageService.downloadFile(document.key);
    const webStream = Readable.toWeb(fileStream as Readable);
    const fileInfo = await fileTypeFromStream(webStream);

    if (!fileInfo) {
      throw new Error(
        'No se pudo determinar el tipo real del archivo (Magic Bytes inválidos).',
      );
    }

    this.validateType(document, fileInfo);
  }

  /**
   * Descarga el archivo a disco y valida en tiempo de streaming que no supere el tamaño esperado.
   */
  private async downloadAndValidateSize(document: Document): Promise<string> {
    const expectedSize = Number(document.size);
    const freshStream = (await this.storageService.downloadFile(
      document.key,
    )) as Readable;

    const cleanExtension = document.extension.replace(/^\./, '') || 'tmp';
    const tempPath = path.join(
      __dirname,
      `../../tmp-${Date.now()}.${cleanExtension}`,
    );
    const writeStream = fs.createWriteStream(tempPath);

    let totalBytesRead = 0;

    freshStream.on('data', (chunk: Buffer) => {
      totalBytesRead += chunk.length;
      if (totalBytesRead > expectedSize) {
        this.cleanupFailedDownload(freshStream, writeStream, tempPath);
        throw new Error(
          'Fraude de tamaño: El archivo es más grande de lo reportado.',
        );
      }
    });

    await new Promise<void>((resolve, reject) => {
      freshStream.pipe(writeStream);
      freshStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', () => resolve());
    });

    if (totalBytesRead !== expectedSize) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw new Error(
        `El tamaño del archivo descargado (${totalBytesRead} bytes) no coincide con el registro (${expectedSize} bytes).`,
      );
    }

    return tempPath;
  }

  private cleanupFailedDownload(
    readStream: Readable,
    writeStream: fs.WriteStream,
    filePath: string,
  ): void {
    readStream.destroy();
    writeStream.destroy();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
