import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { StorageConfig } from 'src/config/storage.config';
import awsConfig from 'src/config/aws.config';
import type { AwsConfig } from 'src/config/aws.config';
import { StorageInterface } from '../storage.interface';

@Injectable()
export class S3StorageService implements StorageInterface {
  private s3client: S3Client;
  private readonly bucketName: string;

  constructor(
    @Inject(awsConfig.KEY)
    private readonly awsConfig: AwsConfig,
  ) {
    if (
      !this.awsConfig.credentials.accessKeyId ||
      !this.awsConfig.credentials.secretAccessKey
    ) {
      throw new Error(
        'Las credenciales de AWS no están configuradas correctamente.',
      );
    }

    this.s3client = new S3Client({
      region: this.awsConfig.region,
      credentials: {
        accessKeyId: this.awsConfig.credentials.accessKeyId,
        secretAccessKey: this.awsConfig.credentials.secretAccessKey,
      },
    });

    this.bucketName = this.awsConfig.bucket!;
  }

  async downloadFile(key: string): Promise<NodeJS.ReadableStream> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3client.send(command);

    const stream = response.Body as NodeJS.ReadableStream;

    return stream;
  }

  async generatePresignedPost(
    userId: string,
    config: { mime: string; ext: string },
  ): Promise<{
    uploadUrl: string;
    fields: Record<string, string>;
    key: string;
  }> {
    if (!config) {
      throw new Error('Invalid MIME type');
    }

    const key = this.generateKey(userId, config.ext);

    const { url, fields } = await createPresignedPost(this.s3client, {
      Bucket: this.bucketName,
      Key: key,
      Conditions: [
        ['content-length-range', 1, StorageConfig.maxSize],
        ['eq', '$Content-Type', config.mime],
      ],
      Fields: {
        key,
        'Content-Type': config.mime,
      },
      Expires: 180,
    });

    return { uploadUrl: url, fields, key };
  }

  private generateKey(userId: string, ext: string): string {
    return `uploads/temp/${userId}/${uuid()}${ext}`;
  }
}
