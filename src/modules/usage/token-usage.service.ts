import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChatModelInteractionType,
  TokenUsage,
} from '../../database/entities/token-usage.entity';

export interface ChatModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

@Injectable()
export class TokenUsageService {
  constructor(
    @InjectRepository(TokenUsage)
    private readonly tokenUsageRepository: Repository<TokenUsage>,
  ) {}

  public async recordIfReliable(
    userId: string,
    modelName: string,
    interactionType: ChatModelInteractionType,
    usage: ChatModelUsage | null,
  ): Promise<void> {
    if (!this.isReliableUsage(usage) || modelName.trim().length === 0) return;

    try {
      await this.tokenUsageRepository.save(
        this.tokenUsageRepository.create({
          userId,
          modelName,
          interactionType,
          ...usage,
        }),
      );
    } catch (error) {
      throw new Error('Failed to persist chat model token usage.', {
        cause: error,
      });
    }
  }

  private isReliableUsage(
    usage: ChatModelUsage | null,
  ): usage is ChatModelUsage {
    if (!usage) return false;

    const counters = [
      usage.promptTokens,
      usage.completionTokens,
      usage.totalTokens,
    ];

    return (
      counters.every((counter) => Number.isInteger(counter) && counter >= 0) &&
      usage.promptTokens + usage.completionTokens === usage.totalTokens
    );
  }
}
