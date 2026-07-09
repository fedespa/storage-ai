import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from 'src/database/entities/chat-message.entity';
import { ChatSession } from 'src/database/entities/chat-session.entity';
import { ChunkingModule } from '../chunking/chunking.module';
import { DocumentsModule } from '../documents/documents.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ListChatMessagesUseCase } from './list-chat-messages/list-chat-messages.use-case';
import { ListChatsUseCase } from './list-chats/list-chats.use-case';
import { SendMessageUseCase } from './send-message/send-message.use-case';
import { ChatPersistenceService } from './shared/chat-persistence.service';
import { ChatRagService } from './shared/chat-rag.service';
import { StartChatUseCase } from './start-chat/start-chat.use-case';
import { UsageModule } from '../usage/usage.module';

@Module({
  controllers: [ChatsController],
  providers: [
    ChatsService,
    ChatPersistenceService,
    ChatRagService,
    ListChatsUseCase,
    StartChatUseCase,
    SendMessageUseCase,
    ListChatMessagesUseCase,
  ],
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    ChunkingModule,
    EmbeddingModule,
    DocumentsModule,
    UsageModule,
  ],
})
export class ChatsModule {}
