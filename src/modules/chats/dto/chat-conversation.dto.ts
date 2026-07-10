import { ChatMessageItemDto } from './chat-message-item.dto';
import { ChatMetadataDto } from './chat-metadata.dto';

export class ChatConversationDto {
  chat!: ChatMetadataDto;
  messages!: ChatMessageItemDto[];
}
