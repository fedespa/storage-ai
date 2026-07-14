import { IsNull, Repository } from 'typeorm';
import { Document } from '../../../database/entities/document.entity';
import { TokenUsage } from '../../../database/entities/token-usage.entity';
import { UsageMetricsService } from '../usage-metrics.service';

describe('UsageMetricsService', () => {
  it('returns the token totals and storage usage for the requested user', async () => {
    const tokenUsageSum = jest
      .fn()
      .mockResolvedValueOnce(120)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(200);
    const tokenUsageRepository = {
      sum: tokenUsageSum,
    } as unknown as Repository<TokenUsage>;
    const documentUsageSum = jest.fn().mockResolvedValue(2_500_000);
    const documentRepository = {
      sum: documentUsageSum,
    } as unknown as Repository<Document>;
    const service = new UsageMetricsService(
      tokenUsageRepository,
      documentRepository,
    );

    await expect(service.getForUser('user-id')).resolves.toEqual({
      tokenUsage: {
        promptTokens: 120,
        completionTokens: 80,
        totalTokens: 200,
      },
      storageUsage: {
        megabytes: 2.5,
      },
    });

    expect(tokenUsageSum).toHaveBeenNthCalledWith(1, 'promptTokens', {
      userId: 'user-id',
    });
    expect(tokenUsageSum).toHaveBeenNthCalledWith(2, 'completionTokens', {
      userId: 'user-id',
    });
    expect(tokenUsageSum).toHaveBeenNthCalledWith(3, 'totalTokens', {
      userId: 'user-id',
    });
  });

  it('aggregates only the requested user non-deleted documents regardless of status', async () => {
    const tokenUsageSum = jest.fn().mockResolvedValue(0);
    const tokenUsageRepository = {
      sum: tokenUsageSum,
    } as unknown as Repository<TokenUsage>;
    const documentUsageSum = jest.fn().mockResolvedValue(3_005_000);
    const documentRepository = {
      sum: documentUsageSum,
    } as unknown as Repository<Document>;
    const service = new UsageMetricsService(
      tokenUsageRepository,
      documentRepository,
    );

    await expect(service.getForUser('workspace-user-id')).resolves.toEqual({
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      storageUsage: {
        megabytes: 3.01,
      },
    });

    expect(documentUsageSum).toHaveBeenCalledWith('size', {
      userId: 'workspace-user-id',
      deletedAt: IsNull(),
    });
  });

  it('returns zero for empty token and storage aggregates', async () => {
    const tokenUsageSum = jest.fn().mockResolvedValue(null);
    const tokenUsageRepository = {
      sum: tokenUsageSum,
    } as unknown as Repository<TokenUsage>;
    const documentUsageSum = jest.fn().mockResolvedValue(null);
    const documentRepository = {
      sum: documentUsageSum,
    } as unknown as Repository<Document>;
    const service = new UsageMetricsService(
      tokenUsageRepository,
      documentRepository,
    );

    await expect(service.getForUser('user-without-usage')).resolves.toEqual({
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      storageUsage: {
        megabytes: 0,
      },
    });
  });
});
