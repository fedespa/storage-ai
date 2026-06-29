import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { RequestWithUser } from 'src/common/request-with-user.interface';
import { StartChatDto } from './dto/start-chat.dto';
import { QueryDto } from './dto/query.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatService: ChatsService) {}

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
}
