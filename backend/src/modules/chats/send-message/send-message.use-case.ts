import { Injectable } from '@nestjs/common';
import { ChatRol } from 'src/database/entities/chat-message.entity';
import { ChatRagService } from '../shared/chat-rag.service';
import { CHAT_FALLBACK_RESPONSE } from '../shared/chat.constants';
import { ChatPersistenceService } from '../shared/chat-persistence.service';

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly chatPersistenceService: ChatPersistenceService,
    private readonly chatRagService: ChatRagService,
  ) {}

  public async execute(
    chatSessionId: string,
    userId: string,
    query: string,
  ): Promise<string> {
    const session =
      await this.chatPersistenceService.getSessionWithDocumentsOrThrow(
        chatSessionId,
        userId,
      );
    const documentIds = session.documents.map((document) => document.id);

    await this.chatPersistenceService.addMessage(
      query,
      chatSessionId,
      ChatRol.USER,
    );

    const chatHistory =
      await this.chatPersistenceService.getRecentChatHistory(chatSessionId);

    chatHistory.pop();

    const reformulatedQuery = await this.chatRagService.rewriteQueryFromHistory(
      chatHistory,
      query,
      userId,
    );
    const context = await this.chatRagService.retrieveContext(
      reformulatedQuery,
      documentIds,
      userId,
    );

    if (!context) {
      await this.chatPersistenceService.addMessage(
        CHAT_FALLBACK_RESPONSE,
        chatSessionId,
        ChatRol.SYSTEM,
      );

      return CHAT_FALLBACK_RESPONSE;
    }

    const systemReply = await this.chatRagService.generateGroundedAnswer(
      query,
      context,
      userId,
      chatHistory,
    );

    await this.chatPersistenceService.addMessage(
      systemReply,
      chatSessionId,
      ChatRol.SYSTEM,
    );

    return systemReply;
  }
}
