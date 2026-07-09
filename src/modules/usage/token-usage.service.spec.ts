import { Repository } from 'typeorm';
import {
  ChatModelInteractionType,
  TokenUsage,
} from '../../database/entities/token-usage.entity';
import { TokenUsageService } from './token-usage.service';

describe('TokenUsageService', () => {
  it('persists exactly one record for reliable usage', async () => {
    const record = new TokenUsage();
    const createMock = jest.fn().mockReturnValue(record);
    const saveMock = jest.fn().mockResolvedValue(record);
    const repository = {
      create: createMock,
      save: saveMock,
    } as unknown as Repository<TokenUsage>;
    const service = new TokenUsageService(repository);

    await service.recordIfReliable(
      'user-id',
      'gpt-4o-mini',
      ChatModelInteractionType.GROUNDED_ANSWER,
      { promptTokens: 12, completionTokens: 8, totalTokens: 20 },
    );

    expect(createMock).toHaveBeenCalledWith({
      userId: 'user-id',
      modelName: 'gpt-4o-mini',
      interactionType: ChatModelInteractionType.GROUNDED_ANSWER,
      promptTokens: 12,
      completionTokens: 8,
      totalTokens: 20,
    });
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('does not persist when usage metadata is unavailable', async () => {
    const createMock = jest.fn();
    const saveMock = jest.fn();
    const repository = {
      create: createMock,
      save: saveMock,
    } as unknown as Repository<TokenUsage>;
    const service = new TokenUsageService(repository);

    await service.recordIfReliable(
      'user-id',
      'gpt-4o-mini',
      ChatModelInteractionType.QUERY_REFORMULATION,
      null,
    );

    expect(createMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('does not persist inconsistent counters', async () => {
    const createMock = jest.fn();
    const saveMock = jest.fn();
    const repository = {
      create: createMock,
      save: saveMock,
    } as unknown as Repository<TokenUsage>;
    const service = new TokenUsageService(repository);

    await service.recordIfReliable(
      'user-id',
      'gpt-4o-mini',
      ChatModelInteractionType.QUERY_REFORMULATION,
      { promptTokens: 12, completionTokens: 8, totalTokens: 21 },
    );

    expect(createMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });
});
