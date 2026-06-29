import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OpenAI } from '@llamaindex/openai';
import { ChatMessage } from 'llamaindex';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Services & Entities
import { DocumentsService } from '../documents/documents.service';
import { ChatSession } from 'src/database/entities/chat-session.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { ChunkingService } from '../chunking/chunking.service';
import {
  ChatMessage as ChatMessageDB,
  ChatRol,
} from 'src/database/entities/chat-message.entity';

// Dtos & Prompts
import { StartChatDto } from './dto/start-chat.dto';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_REWRITING } from './chats.prompts';

@Injectable()
export class ChatsService {
  private llm: OpenAI;
  private readonly MIN_LIMIT = 4;
  private readonly GLOBAL_LIMIT = 10;
  private readonly CHUNKS_PER_FILE = 3;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly chunkingService: ChunkingService,
    private readonly documentsService: DocumentsService,
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessageDB)
    private readonly chatMessageRepository: Repository<ChatMessageDB>,
  ) {
    this.llm = new OpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.2,
    });
  }

  // ==========================================
  // METODOS PÚBLICOS (API del Servicio)
  // ==========================================

  /**
   * Inicializa una nueva sesión de chat indexando el contexto del o los documentos provistos.
   */
  public async startChat(dto: StartChatDto, userId: string) {
    const { documentIds, query } = dto;

    await this.validateDocuments(documentIds, userId);

    const limit = this.determineChunksLimit(documentIds.length);

    const { id: chatSessionId } = await this.createSessionWithInitialMessage(
      userId,
      'Nuevo Chat',
      query,
      documentIds,
    );

    const queryString = await this.generateEmbedding(query);

    const documents = await this.chunkingService.retrieveParentContext(
      queryString,
      documentIds,
      userId,
      limit,
    );

    if (documents.length === 0) {
      return 'No encontré información relacionada en el documento para responder a tu pregunta.';
    }

    const context = documents.map((doc) => `${doc.content}`).join('\n\n');

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `A continuación se te proporciona el contexto necesario para responder la pregunta. ### CONTEXTO ### ${context} ############### Pregunta del usuario: ${query}`,
      },
    ];

    const response = await this.llm.chat({ messages });

    await this.addMessage(
      response.message.content as string,
      chatSessionId,
      ChatRol.SYSTEM,
    );

    return response.message.content;
  }

  /**
   * Continúa un hilo de chat existente reformulando la consulta según el contexto histórico del chat.
   */
  public async sendMessage(
    chatSessionId: string,
    userId: string,
    query: string,
  ) {
    const session = await this.chatSessionRepository.findOne({
      where: { id: chatSessionId, userId },
      relations: ['documents'],
    });

    if (!session) throw new UnauthorizedException('Chat no encontrado');
    const documentIds = session.documents.map((doc) => doc.id);

    await this.addMessage(query, chatSessionId, ChatRol.USER);

    const chatHistory = await this.getRecentChatHistory(chatSessionId);

    chatHistory.pop();
    const previousHistory = chatHistory;

    const rewritingMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT_REWRITING },
      ...previousHistory,
      {
        role: 'user',
        content: `Ultima pregunta del usuario: ${query}`,
      },
    ];

    const rewritingResponse = await this.llm.chat({
      messages: rewritingMessages,
    });
    const reformulatedQuery = rewritingResponse.message.content as string;
    console.log('REFORMULATED QUERY', reformulatedQuery);

    const queryString = await this.generateEmbedding(reformulatedQuery);
    const limit = this.determineChunksLimit(documentIds.length);
    const documents = await this.chunkingService.retrieveParentContext(
      queryString,
      documentIds,
      userId,
      limit,
    );

    if (documents.length === 0) {
      const fallbackResponse =
        'No encontré información relacionada en el documento para responder a tu pregunta.';
      await this.addMessage(fallbackResponse, chatSessionId, ChatRol.SYSTEM);
      return fallbackResponse;
    }

    const context = documents.map((doc) => `${doc.content}`).join('\n\n');

    const finalMessages: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...previousHistory,
      {
        role: 'user',
        content: `A continuación se te proporciona el contexto necesario para responder la pregunta. ### CONTEXTO ### ${context} ############### Pregunta del usuario: ${query}`,
      },
    ];

    const response = await this.llm.chat({ messages: finalMessages });
    const systemReply = response.message.content as string;

    console.log(systemReply);

    await this.addMessage(systemReply, chatSessionId, ChatRol.SYSTEM);

    return systemReply;
  }

  // ==========================================
  // METODOS PRIVADOS (Soporte / Utilidades)
  // ==========================================

  /**
   * Recupera los últimos 8 mensajes del chat adaptándolos a la interfaz de LlamaIndex.
   */
  private async getRecentChatHistory(
    chatSessionId: string,
  ): Promise<ChatMessage[]> {
    const dbMessages = await this.chatMessageRepository.find({
      where: { chatSessionId },
      order: { id: 'DESC' },
      take: 8,
    });

    return dbMessages.reverse().map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'system',
      content: msg.content,
    }));
  }

  /**
   * Calcula dinámicamente el límite de chunks que se extraerán según el número de archivos adjuntos.
   */
  private determineChunksLimit(numberOfFiles: number): number {
    if (!numberOfFiles || numberOfFiles === 0) return this.GLOBAL_LIMIT;

    if (numberOfFiles === 1) return this.MIN_LIMIT;

    const proportionalLimit = Math.min(
      numberOfFiles * this.CHUNKS_PER_FILE,
      20,
    );

    return Math.max(this.MIN_LIMIT, proportionalLimit);
  }

  /**
   * Genera el embedding de la query del usuario formateándolo como string vectorizado.
   */
  private async generateEmbedding(query: string): Promise<string> {
    const queryVector =
      await this.embeddingService.generateQueryEmbedding(query);
    return `[${queryVector.join(',')}]`;
  }

  /**
   * Valida la pertenencia y vigencia de los documentos seleccionados por el cliente.
   */
  private async validateDocuments(documentIds: string[], userId: string) {
    if (documentIds && documentIds.length > 0) {
      const areValidDocuments = await this.documentsService.validateDocuments(
        documentIds,
        userId,
      );
      if (!areValidDocuments)
        throw new UnauthorizedException(
          'Los documentos enviados no son válidos',
        );
    }
  }

  /**
   * Persiste un mensaje en el log histórico del chat.
   */
  private async addMessage(
    content: string,
    chatSessionId: string,
    role: ChatRol,
  ) {
    const newMessage = this.chatMessageRepository.create({
      chatSessionId,
      content,
      role,
    });

    return await this.chatMessageRepository.save(newMessage);
  }

  /**
   * Crea el registro inicial de una sesión conversacional junto a su primer input de usuario.
   */
  private async createSessionWithInitialMessage(
    userId: string,
    title: string,
    messageContent: string,
    documentIds: string[],
  ) {
    const newSession = this.chatSessionRepository.create({
      userId: userId,
      title: title,
      documents: documentIds.map((id) => ({ id })),
      messages: [
        {
          content: messageContent,
          role: ChatRol.USER,
        },
      ],
    });

    return await this.chatSessionRepository.save(newSession);
  }
}
