import { extractChatModelUsage } from '../token-usage.extractor';

describe('extractChatModelUsage', () => {
  it('extracts complete and consistent usage metadata', () => {
    expect(
      extractChatModelUsage({
        usage: {
          prompt_tokens: 12,
          completion_tokens: 8,
          total_tokens: 20,
        },
      }),
    ).toEqual({ promptTokens: 12, completionTokens: 8, totalTokens: 20 });
  });

  it.each([
    null,
    {},
    { usage: null },
    { usage: { prompt_tokens: 12, completion_tokens: 8 } },
    { usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 21 } },
    { usage: { prompt_tokens: '12', completion_tokens: 8, total_tokens: 20 } },
  ])('rejects unreliable metadata: %p', (rawResponse) => {
    expect(extractChatModelUsage(rawResponse)).toBeNull();
  });

  it('accepts zero-valued counters when they are consistent', () => {
    expect(
      extractChatModelUsage({
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      }),
    ).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  });
});
