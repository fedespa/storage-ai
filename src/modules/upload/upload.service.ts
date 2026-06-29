import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { UploadDto } from './dto/upload.dto';
import { DocumentValidator } from '../documents/document.validator';
import type { StorageInterface } from '../../common/storage/storage.interface';
import { STORAGE_SERVICE_TOKEN } from '../../common/storage/storage.module';

@Injectable()
export class UploadService {
  constructor(
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: StorageInterface,
    private readonly documentService: DocumentsService,
  ) {}

  public async upload(userId: string, params: UploadDto) {
    const { type, size, name } = params;

    const config = DocumentValidator.getFileConfig(type);

    if (!config) {
      throw new BadRequestException(
        `El tipo de archivo '${type}' no está permitido o no es válido.`,
      );
    }

    if (!DocumentValidator.validateFileSize(size)) {
      throw new BadRequestException('El tamaño maximo permitido es 100 MB');
    }

    const { uploadUrl, fields, key } =
      await this.storageService.generatePresignedPost(userId, config);

    const document = await this.documentService.create({
      userId,
      size,
      name,
      extension: config.ext,
      mimeType: config.mime,
      key,
    });

    return { documentId: document.id, uploadUrl, fields };
  }
}
