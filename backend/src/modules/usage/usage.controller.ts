import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/request-with-user.interface';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UsageRequestDto } from './dto/usage-request.dto';
import { UsageMetricsService } from './usage-metrics.service';

@Controller('usage')
export class UsageController {
  constructor(private readonly usageMetricsService: UsageMetricsService) {}

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  public getUsage(
    @Req() request: RequestWithUser,
    @Query() query: UsageRequestDto,
    @Body() body: UsageRequestDto,
  ) {
    if (query.userId !== undefined || body.userId !== undefined) {
      throw new BadRequestException('A user identifier is not accepted.');
    }

    return this.usageMetricsService.getForUser(request.user.userId);
  }
}
