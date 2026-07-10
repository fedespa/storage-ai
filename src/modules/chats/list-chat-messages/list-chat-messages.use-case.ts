import { Injectable } from '@nestjs/common';
import { ChatConversationDto } from '../dto/chat-conversation.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { ChatPersistenceService } from '../shared/chat-persistence.service';
import { buildPaginatedResponse } from '../../../common/pagination/pagination';
import { mapChatMessageItem, mapChatMetadata } from '../shared/chat-presenters';

@Injectable()
export class ListChatMessagesUseCase {
  constructor(
    private readonly chatPersistenceService: ChatPersistenceService,
  ) {}

  public async execute(
    chatSessionId: string,
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ChatConversationDto>> {
    const chatSession =
      await this.chatPersistenceService.getSessionMetadataOrThrow(
        chatSessionId,
        userId,
      );
    const [messages, total] =
      await this.chatPersistenceService.listMessagesByChatSession(
        chatSessionId,
        pagination,
      );

    const conversation: ChatConversationDto = {
      chat: mapChatMetadata(chatSession),
      messages: messages.map(mapChatMessageItem),
    };

    return buildPaginatedResponse(
      conversation,
      total,
      pagination.page,
      pagination.limit,
    );
  }
}
