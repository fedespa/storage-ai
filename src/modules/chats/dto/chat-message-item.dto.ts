import { ChatRol } from 'src/database/entities/chat-message.entity';

export class ChatMessageItemDto {
  id!: number;
  chatSessionId!: string;
  role!: ChatRol;
  content!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
