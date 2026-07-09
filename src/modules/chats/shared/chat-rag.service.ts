import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OpenAI } from '@llamaindex/openai';
import { ChatMessage as LlamaIndexChatMessage } from 'llamaindex';
import { ChunkingService } from '../../chunking/chunking.service';
import { DocumentsService } from '../../documents/documents.service';
import { EmbeddingService } from '../../embedding/embedding.service';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_REWRITING } from '../chats.prompts';
import {
  CHUNKS_PER_FILE,
  DEFAULT_CHUNK_LIMIT,
  MAXIMUM_CHUNK_LIMIT,
  MINIMUM_CHUNK_LIMIT,
} from './chat.constants';
import { ChatModelInteractionType } from '../../../database/entities/token-usage.entity';
import { extractChatModelUsage } from '../../usage/token-usage.extractor';
import { TokenUsageService } from '../../usage/token-usage.service';

@Injectable()
export class ChatRagService {
  private readonly llm: OpenAI;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly chunkingService: ChunkingService,
    private readonly documentsService: DocumentsService,
    private readonly tokenUsageService: TokenUsageService,
  ) {
    this.llm = new OpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.2,
    });
  }

  public async validateSelectedDocuments(
    documentIds: string[],
    userId: string,
  ): Promise<void> {
    if (documentIds.length === 0) {
      return;
    }

    const areValidDocuments = await this.documentsService.validateDocuments(
      documentIds,
      userId,
    );

    if (!areValidDocuments) {
      throw new UnauthorizedException('Los documentos enviados no son validos');
    }
  }

  public async rewriteQueryFromHistory(
    chatHistory: LlamaIndexChatMessage[],
    query: string,
    userId: string,
  ): Promise<string> {
    const rewritingMessages: LlamaIndexChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT_REWRITING },
      ...chatHistory,
      {
        role: 'user',
        content: `Ultima pregunta del usuario: ${query}`,
      },
    ];

    const rewritingResponse = await this.llm.chat({
      messages: rewritingMessages,
    });
    const rewrittenQuery = this.getTextResponseContent(
      rewritingResponse.message.content,
    );
    await this.recordUsage(
      rewritingResponse.raw,
      userId,
      ChatModelInteractionType.QUERY_REFORMULATION,
    );

    return rewrittenQuery;
  }

  public async retrieveContext(
    query: string,
    documentIds: string[],
    userId: string,
  ): Promise<string | null> {
    const queryString = await this.generateEmbedding(query);
    const limit = this.determineChunksLimit(documentIds.length);
    const retrievedDocuments = await this.chunkingService.retrieveParentContext(
      queryString,
      documentIds,
      userId,
      limit,
    );

    return retrievedDocuments.map((document) => document.content).join('\n\n');
  }

  public async generateGroundedAnswer(
    query: string,
    context: string,
    userId: string,
    chatHistory: LlamaIndexChatMessage[] = [],
  ): Promise<string> {
    const messages: LlamaIndexChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...chatHistory,
      {
        role: 'user',
        content: this.buildGroundedQuestionMessage(query, context),
      },
    ];

    const response = await this.llm.chat({ messages });
    const groundedAnswer = this.getTextResponseContent(
      response.message.content,
    );
    await this.recordUsage(
      response.raw,
      userId,
      ChatModelInteractionType.GROUNDED_ANSWER,
    );

    return groundedAnswer;
  }

  private determineChunksLimit(numberOfFiles: number): number {
    if (numberOfFiles === 0) {
      return DEFAULT_CHUNK_LIMIT;
    }

    if (numberOfFiles === 1) {
      return MINIMUM_CHUNK_LIMIT;
    }

    const proportionalLimit = Math.min(
      numberOfFiles * CHUNKS_PER_FILE,
      MAXIMUM_CHUNK_LIMIT,
    );

    return Math.max(MINIMUM_CHUNK_LIMIT, proportionalLimit);
  }

  private async generateEmbedding(query: string): Promise<string> {
    const queryVector =
      await this.embeddingService.generateQueryEmbedding(query);

    return `[${queryVector.join(',')}]`;
  }

  private buildGroundedQuestionMessage(query: string, context: string): string {
    return `A continuacion se te proporciona el contexto necesario para responder la pregunta. ### CONTEXTO ### ${context} ############### Pregunta del usuario: ${query}`;
  }

  private getTextResponseContent(content: unknown): string {
    if (typeof content !== 'string') {
      throw new Error('Chat model returned an invalid text response.');
    }

    return content;
  }

  private async recordUsage(
    rawResponse: object | null,
    userId: string,
    interactionType: ChatModelInteractionType,
  ): Promise<void> {
    await this.tokenUsageService.recordIfReliable(
      userId,
      this.llm.model,
      interactionType,
      extractChatModelUsage(rawResponse),
    );
  }
}
