import { ChatModelUsage } from './token-usage.service';

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const extractChatModelUsage = (
  rawResponse: object | null,
): ChatModelUsage | null => {
  if (!rawResponse || !('usage' in rawResponse)) return null;

  const usage = rawResponse.usage;
  if (!usage || typeof usage !== 'object') return null;

  const usageRecord = usage as Record<string, unknown>;
  const promptTokens = usageRecord.prompt_tokens;
  const completionTokens = usageRecord.completion_tokens;
  const totalTokens = usageRecord.total_tokens;

  if (
    !isNonNegativeInteger(promptTokens) ||
    !isNonNegativeInteger(completionTokens) ||
    !isNonNegativeInteger(totalTokens) ||
    promptTokens + completionTokens !== totalTokens
  )
    return null;

  return { promptTokens, completionTokens, totalTokens };
};
