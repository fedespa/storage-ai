import { Injectable } from '@nestjs/common';
import { ChatRol } from 'src/database/entities/chat-message.entity';
import { StartChatDto } from './start-chat.dto';
import { ChatRagService } from '../shared/chat-rag.service';
import { ChatPersistenceService } from '../shared/chat-persistence.service';
import { CHAT_FALLBACK_RESPONSE } from '../shared/chat.constants';
import { buildChatTitleFromFirstMessage } from '../shared/chat-title.builder';

@Injectable()
export class StartChatUseCase {
  constructor(
    private readonly chatPersistenceService: ChatPersistenceService,
    private readonly chatRagService: ChatRagService,
  ) {}

  public async execute(dto: StartChatDto, userId: string): Promise<string> {
    const { documentIds = [], query } = dto;

    await this.chatRagService.validateSelectedDocuments(documentIds, userId);

    const chatTitle = buildChatTitleFromFirstMessage(query);
    const { id: chatSessionId } =
      await this.chatPersistenceService.createSessionWithInitialMessage(
        userId,
        chatTitle,
        query,
        documentIds,
      );
    const context = await this.chatRagService.retrieveContext(
      query,
      documentIds,
      userId,
    );

    if (!context) {
      return CHAT_FALLBACK_RESPONSE;
    }

    const systemReply = await this.chatRagService.generateGroundedAnswer(
      query,
      context,
      userId,
    );

    await this.chatPersistenceService.addMessage(
      systemReply,
      chatSessionId,
      ChatRol.SYSTEM,
    );

    return systemReply;
  }
}
