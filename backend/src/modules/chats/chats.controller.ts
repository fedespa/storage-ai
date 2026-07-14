import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/request-with-user.interface';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ChatsService } from './chats.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { QueryDto } from './send-message/query.dto';
import { StartChatDto } from './start-chat/start-chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatService: ChatsService) {}

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  public async listChats(
    @Req() request: RequestWithUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    return await this.chatService.listChats(request.user.userId, pagination);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createChat(
    @Body() body: StartChatDto,
    @Req() request: RequestWithUser,
  ) {
    const response = await this.chatService.startChat(
      body,
      request.user.userId,
    );

    return {
      message: response,
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/:id')
  public async sendMessage(
    @Param('id', new ParseUUIDPipe({ version: '4' })) chatSessionId: string,
    @Req() request: RequestWithUser,
    @Body() body: QueryDto,
  ) {
    const response = await this.chatService.sendMessage(
      chatSessionId,
      request.user.userId,
      body.query,
    );

    return {
      response,
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/:id/messages')
  public async listChatMessages(
    @Param('id', new ParseUUIDPipe({ version: '4' })) chatSessionId: string,
    @Req() request: RequestWithUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    return await this.chatService.listChatMessages(
      chatSessionId,
      request.user.userId,
      pagination,
    );
  }
}
