import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChunkingModule } from '../chunking/chunking.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { DocumentsModule } from '../documents/documents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from 'src/database/entities/chat-session.entity';
import { ChatMessage } from 'src/database/entities/chat-message.entity';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService],
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    ChunkingModule,
    EmbeddingModule,
    DocumentsModule,
  ],
})
export class ChatsModule {}
