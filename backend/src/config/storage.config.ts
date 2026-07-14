export class StorageConfig {
  static readonly maxSize: number = 100 * 1024 * 1024;
  static readonly allowedMimeTypes: Record<
    string,
    { mime: string; ext: string }
  > = {
    pdf: {
      mime: 'application/pdf',
      ext: '.pdf',
    },
    docx: {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: '.docx',
    },
    txt: {
      mime: 'text/plain',
      ext: '.txt',
    },
  };
}
