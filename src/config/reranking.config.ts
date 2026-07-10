import { registerAs } from '@nestjs/config';

export interface RerankingConfig {
  enabled: boolean;
  provider: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  topKIn: number;
  topKOut: number;
  minScore: number;
  timeoutMs: number;
}

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default registerAs(
  'reranking',
  (): RerankingConfig => ({
    enabled: process.env.RERANKING_ENABLED !== 'false',
    provider: process.env.RERANKING_PROVIDER || 'cross-encoder-jina',
    apiUrl: process.env.RERANKING_API_URL || 'https://api.jina.ai/v1/rerank',
    apiKey: process.env.RERANKING_API_KEY || '',
    model: process.env.RERANKING_MODEL || 'jina-reranker-v2-base-multilingual',
    topKIn: parseNumber(process.env.RERANKING_TOP_K_IN, 10),
    topKOut: parseNumber(process.env.RERANKING_TOP_K_OUT, 3),
    minScore: parseNumber(process.env.RERANKING_MIN_SCORE, 0),
    timeoutMs: parseNumber(process.env.RERANKING_TIMEOUT_MS, 1500),
  }),
);
