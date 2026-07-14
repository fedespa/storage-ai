import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessage as LlamaIndexChatMessage } from 'llamaindex';
import { IsNull, Repository } from 'typeorm';
import { ChatSession } from 'src/database/entities/chat-session.entity';
import {
  ChatMessage as ChatMessageEntity,
  ChatRol,
} from 'src/database/entities/chat-message.entity';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { MAXIMUM_RAG_HISTORY_MESSAGES } from './chat.constants';
import { calculateOffset } from '../../../common/pagination/pagination';
import { mapToLlamaIndexChatMessage } from './chat-presenters';

@Injectable()
export class ChatPersistenceService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessageEntity)
    private readonly chatMessageRepository: Repository<ChatMessageEntity>,
  ) {}

  public async listChatsByUser(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<[ChatSession[], number]> {
    const { page, limit } = pagination;

    return await this.chatSessionRepository.findAndCount({
      where: {
        userId,
        deletedAt: IsNull(),
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      order: {
        updatedAt: 'DESC',
      },
      skip: calculateOffset(page, limit),
      take: limit,
    });
  }

  public async getSessionWithDocumentsOrThrow(
    chatSessionId: string,
    userId: string,
  ): Promise<ChatSession> {
    const session = await this.chatSessionRepository.findOne({
      where: {
        id: chatSessionId,
        userId,
        deletedAt: IsNull(),
      },
      relations: ['documents'],
    });

    if (!session) {
      throw new UnauthorizedException('Chat no encontrado');
    }

    return session;
  }

  public async getSessionMetadataOrThrow(
    chatSessionId: string,
    userId: string,
  ): Promise<ChatSession> {
    const session = await this.chatSessionRepository.findOne({
      where: {
        id: chatSessionId,
        userId,
        deletedAt: IsNull(),
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Chat no encontrado');
    }

    return session;
  }

  public async listMessagesByChatSession(
    chatSessionId: string,
    pagination: PaginationQueryDto,
  ): Promise<[ChatMessageEntity[], number]> {
    const { page, limit } = pagination;

    return await this.chatMessageRepository.findAndCount({
      where: {
        chatSessionId,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'ASC',
      },
      skip: calculateOffset(page, limit),
      take: limit,
    });
  }

  public async getRecentChatHistory(
    chatSessionId: string,
  ): Promise<LlamaIndexChatMessage[]> {
    const dbMessages = await this.chatMessageRepository.find({
      where: {
        chatSessionId,
        deletedAt: IsNull(),
      },
      order: {
        id: 'DESC',
      },
      take: MAXIMUM_RAG_HISTORY_MESSAGES,
    });

    return dbMessages.reverse().map(mapToLlamaIndexChatMessage);
  }

  public async createSessionWithInitialMessage(
    userId: string,
    title: string,
    messageContent: string,
    documentIds: string[],
  ): Promise<ChatSession> {
    const newSession = this.chatSessionRepository.create({
      userId,
      title,
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

  public async addMessage(
    content: string,
    chatSessionId: string,
    role: ChatRol,
  ): Promise<ChatMessageEntity> {
    const newMessage = this.chatMessageRepository.create({
      chatSessionId,
      content,
      role,
    });

    return await this.chatMessageRepository.save(newMessage);
  }
}
