import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { RequestWithUser } from 'src/common/request-with-user.interface';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(AuthGuard)
  @Post(':id/confirm')
  public async confirm(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
  ) {
    await this.documentsService.confirm(request.user.userId, id);
  }
}
