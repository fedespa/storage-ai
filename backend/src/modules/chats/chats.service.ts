import { Injectable } from '@nestjs/common';
import { ChatConversationDto } from './dto/chat-conversation.dto';
import { ChatListItemDto } from './dto/chat-list-item.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { StartChatDto } from './start-chat/start-chat.dto';
import { ListChatMessagesUseCase } from './list-chat-messages/list-chat-messages.use-case';
import { ListChatsUseCase } from './list-chats/list-chats.use-case';
import { SendMessageUseCase } from './send-message/send-message.use-case';
import { StartChatUseCase } from './start-chat/start-chat.use-case';

@Injectable()
export class ChatsService {
  constructor(
    private readonly listChatsUseCase: ListChatsUseCase,
    private readonly startChatUseCase: StartChatUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly listChatMessagesUseCase: ListChatMessagesUseCase,
  ) {}

  public async listChats(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ChatListItemDto[]>> {
    return await this.listChatsUseCase.execute(userId, pagination);
  }

  public async startChat(dto: StartChatDto, userId: string): Promise<string> {
    return await this.startChatUseCase.execute(dto, userId);
  }

  public async sendMessage(
    chatSessionId: string,
    userId: string,
    query: string,
  ): Promise<string> {
    return await this.sendMessageUseCase.execute(chatSessionId, userId, query);
  }

  public async listChatMessages(
    chatSessionId: string,
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ChatConversationDto>> {
    return await this.listChatMessagesUseCase.execute(
      chatSessionId,
      userId,
      pagination,
    );
  }
}
