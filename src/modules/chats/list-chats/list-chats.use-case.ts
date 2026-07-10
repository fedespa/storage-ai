import { Injectable } from '@nestjs/common';
import { ChatListItemDto } from '../dto/chat-list-item.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { ChatPersistenceService } from '../shared/chat-persistence.service';
import { buildPaginatedResponse } from '../../../common/pagination/pagination';
import { mapChatListItem } from '../shared/chat-presenters';

@Injectable()
export class ListChatsUseCase {
  constructor(
    private readonly chatPersistenceService: ChatPersistenceService,
  ) {}

  public async execute(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ChatListItemDto[]>> {
    const [chatSessions, total] =
      await this.chatPersistenceService.listChatsByUser(userId, pagination);
    const chats = chatSessions.map(mapChatListItem);

    return buildPaginatedResponse(
      chats,
      total,
      pagination.page,
      pagination.limit,
    );
  }
}
