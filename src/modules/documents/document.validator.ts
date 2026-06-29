import { StorageConfig } from 'src/config/storage.config';

export class DocumentValidator {
  static validateMimeType(mimeType: string): string | undefined {
    return StorageConfig.allowedMimeTypes[mimeType].mime;
  }

  static validateFileSize(fileSize: number): boolean {
    return fileSize <= StorageConfig.maxSize;
  }

  static getFileConfig(type: string) {
    return StorageConfig.allowedMimeTypes[type];
  }
}
