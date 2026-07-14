import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { RequestWithUser } from 'src/common/request-with-user.interface';
import { UploadDto } from './dto/upload.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(AuthGuard)
  @Post()
  public async upload(
    @Req() request: RequestWithUser,
    @Body() body: UploadDto,
  ) {
    const { documentId, uploadUrl, fields } = await this.uploadService.upload(
      request.user.userId,
      body,
    );

    return { documentId, uploadUrl, fields };
  }
}
