import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Document } from '../../database/entities/document.entity';
import { TokenUsage } from '../../database/entities/token-usage.entity';

export interface UserUsageMetrics {
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  storageUsage: {
    megabytes: number;
  };
}

@Injectable()
export class UsageMetricsService {
  constructor(
    @InjectRepository(TokenUsage)
    private readonly tokenUsageRepository: Repository<TokenUsage>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  public async getForUser(userId: string): Promise<UserUsageMetrics> {
    try {
      const [promptTokens, completionTokens, totalTokens, storageBytes] =
        await Promise.all([
          this.tokenUsageRepository.sum('promptTokens', { userId }),
          this.tokenUsageRepository.sum('completionTokens', { userId }),
          this.tokenUsageRepository.sum('totalTokens', { userId }),
          this.documentRepository.sum('size', {
            userId,
            deletedAt: IsNull(),
          }),
        ]);

      return {
        tokenUsage: {
          promptTokens: promptTokens ?? 0,
          completionTokens: completionTokens ?? 0,
          totalTokens: totalTokens ?? 0,
        },
        storageUsage: {
          megabytes: this.convertBytesToMegabytes(storageBytes ?? 0),
        },
      };
    } catch (error) {
      throw new Error('Failed to aggregate user usage metrics.', {
        cause: error,
      });
    }
  }

  private convertBytesToMegabytes(storageBytes: number): number {
    return Math.round((storageBytes / 1_000_000) * 100) / 100;
  }
}
