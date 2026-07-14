export interface StorageInterface {
  generatePresignedPost(
    userId: string,
    config: { mime: string; ext: string },
  ): Promise<{
    uploadUrl: string;
    fields: Record<string, string>;
    key: string;
  }>;

  downloadFile(key: string): Promise<NodeJS.ReadableStream>;
}
