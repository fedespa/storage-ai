import { ChatMessage as LlamaIndexChatMessage } from 'llamaindex';
import { ChatSession } from 'src/database/entities/chat-session.entity';
import {
  ChatMessage as ChatMessageEntity,
  ChatRol,
} from 'src/database/entities/chat-message.entity';
import { ChatListItemDto } from '../dto/chat-list-item.dto';
import { ChatMessageItemDto } from '../dto/chat-message-item.dto';
import { ChatMetadataDto } from '../dto/chat-metadata.dto';

export function mapChatListItem(chatSession: ChatSession): ChatListItemDto {
  return {
    id: chatSession.id,
    title: chatSession.title,
    createdAt: chatSession.createdAt,
    updatedAt: chatSession.updatedAt,
  };
}

export function mapChatMetadata(chatSession: ChatSession): ChatMetadataDto {
  return {
    id: chatSession.id,
    title: chatSession.title,
    createdAt: chatSession.createdAt,
    updatedAt: chatSession.updatedAt,
  };
}

export function mapChatMessageItem(
  message: ChatMessageEntity,
): ChatMessageItemDto {
  return {
    id: message.id,
    chatSessionId: message.chatSessionId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export function mapToLlamaIndexChatMessage(
  message: ChatMessageEntity,
): LlamaIndexChatMessage {
  return {
    role: message.role === ChatRol.USER ? 'user' : 'system',
    content: message.content,
  };
}
