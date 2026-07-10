import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/request-with-user.interface';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { buildPaginatedResponse } from '../../common/pagination/pagination';
import { mapDocumentListItem } from './document-presenters';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  public async listDocuments(
    @Req() request: RequestWithUser,
    @Query() query: DocumentListQueryDto,
  ) {
    const [documents, total] = await this.documentsService.listByUser(
      request.user.userId,
      query,
    );

    return buildPaginatedResponse(
      documents.map(mapDocumentListItem),
      total,
      query.page,
      query.limit,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':id/confirm')
  public async confirm(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
  ) {
    await this.documentsService.confirm(request.user.userId, id);
  }
}
